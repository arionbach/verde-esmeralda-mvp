// src/server/financeiro/financeiro.service.ts
// Invariantes do Modelo A — Condominial Real (NÃO ALTERAR SEM DECISÃO EXPLÍCITA)
// - Pagamento é o livro-razão único (KPIs, Previsto/Realizado sempre derivados de Pagamento)
// - RateioItem é memória de cálculo (projeção técnica do rateio por competência)
// - Políticas (mínimo, fundo, exceções) devem ser modeladas como AjusteUnidade (CREDITO/DEBITO)
// - NUNCA calcular KPIs diretamente sobre cadastros (ex.: DespesaFixa) - somente Pagamento
//
// GOVERNANÇA (resumo prático)
// - Livro‑razão oficial: Pagamento
// - Receita oficial deriva exclusivamente de Pagamento
// - Competência sempre explícita; normalização/parsing centralizados aqui
// - Decimal interno (Prisma.Decimal); conversão para number apenas no boundary (rotas)
// - route.ts delega; este service decide
// - ADR‑007 é regra executável e deve ser respeitada por operações financeiras
import { prisma } from '@/lib/prisma'
import { PagamentoStatus, Prisma, PagamentoTipo, OrigemRateio, NaturezaLancamento } from '@prisma/client'
import { endOfMonth } from 'date-fns'
import { PagamentoRepository } from '@/server/repositories/PagamentoRepository'
import { isCompetenciaFechada } from '@/server/financeiro/competencia-status.service'
import { 
  parseCompetencia as parseCompetenciaLib, 
  parseCompetenciaTolerant,
  calcularVencimento 
} from '@/lib/competencia'

export type FinanceiroStatusUI = 'PENDENTE' | 'ATRASADO' | 'PAGO'

// Governança: helpers financeiros puros (sem I/O) para padronizar regras
// Regra oficial de "vencido": status PENDENTE e vencimento < agora
export function isVencido(status: PagamentoStatus | string, vencimento: Date, agora: Date = new Date()) {
  return String(status) === 'PENDENTE' && vencimento < agora
}

// Re-export do helper consolidado para manter compatibilidade
export const parseCompetencia = parseCompetenciaTolerant
export const parseCompetenciaStrict = parseCompetenciaLib

export async function gerarMensalidades(
  predioId: string,
  competencia: string,
  opts?: { vencimentoDia?: number; valorPadrao?: number; sobrescrever?: boolean }
) {
  const { inicio, fim, competenciaStr } = parseCompetencia(competencia)
  if (await isCompetenciaFechada(predioId, inicio)) {
    throw new Error('Competência fechada. Operação não permitida.')
  }
  const dia = opts?.vencimentoDia && opts.vencimentoDia >= 1 && opts.vencimentoDia <= 28 ? opts.vencimentoDia : 10
  const vencimento = new Date(inicio.getFullYear(), inicio.getMonth(), dia)

  const unidades = await prisma.unidade.findMany({
    where: { predioId, ativo: true },
    select: { id: true, valorTaxa: true },
  })

  let created = 0
  let updated = 0
  let skipped = 0

  for (const u of unidades) {
    const valorUnidade = Number(u.valorTaxa ?? 0)
    const valor = valorUnidade > 0 ? valorUnidade : Number(opts?.valorPadrao ?? 0)
    if (!valor || valor <= 0) { skipped++; continue }

    const existing = await PagamentoRepository.findFirst({
      where: {
        predioId,
        unidadeId: u.id,
        tipo: PagamentoTipo.TAXA_MENSAL,
        competencia: { gte: inicio, lte: fim },
      },
      select: { id: true },
    })

    if (existing) {
      if (opts?.sobrescrever) {
        await PagamentoRepository.update({
          where: { id: existing.id },
          data: { valor, vencimento, status: PagamentoStatus.PENDENTE },
        })
        updated++
      } else {
        skipped++
      }
    } else {
      await PagamentoRepository.create({
        data: {
          predioId,
          unidadeId: u.id,
          tipo: PagamentoTipo.TAXA_MENSAL,
          status: PagamentoStatus.PENDENTE,
          competencia: inicio,
          vencimento,
          valor,
        },
      })
      created++
    }
  }

  return { competencia: competenciaStr, resumo: { created, updated, skipped, totalUnidades: unidades.length } }
}

// Atualiza pagamento para PAGO mantendo valores como Decimal internamente
export async function pagarPagamento(id: string) {
  const now = new Date()
  const pago = await PagamentoRepository.update({
    where: { id },
    data: { status: PagamentoStatus.PAGO, dataPagamento: now },
    select: {
      id: true,
      status: true,
      dataPagamento: true,
      valor: true,
      unidadeId: true,
      competencia: true,
    },
  })
  return pago
}

// Estorna pagamento (volta a PENDENTE/ATRASADO conforme vencimento)
export async function estornarPagamento(id: string) {
  const p = await PagamentoRepository.findUnique({
    where: { id },
    select: { id: true, status: true, vencimento: true },
  })
  if (!p) throw new Error('Pagamento não encontrado')

  // Guardrail: impedir escrita em competência fechada
  {
    const det = await PagamentoRepository.findUnique({ where: { id }, select: { predioId: true, competencia: true } })
    if (det?.predioId && det?.competencia) {
      if (await isCompetenciaFechada(det.predioId, det.competencia)) {
        throw new Error('Competência fechada. Operação não permitida.')
      }
    }
  }
  const hoje = new Date()
  const novoStatus: PagamentoStatus = isVencido('PENDENTE', p.vencimento, hoje)
    ? PagamentoStatus.ATRASADO
    : PagamentoStatus.PENDENTE

  const up = await PagamentoRepository.update({
    where: { id },
    data: { status: novoStatus, dataPagamento: null },
    select: { id: true, status: true, dataPagamento: true },
  })
  return up
}

export async function recalcularStatus(predioId: string, competencia: string) {
  const { inicio, fim } = parseCompetencia(competencia)
  const agora = new Date()

  const whereBase: Prisma.PagamentoWhereInput = {
    predioId,
    competencia: { gte: inicio, lte: fim },
    NOT: { status: PagamentoStatus.PAGO },
  }

  const atrasados = await PagamentoRepository.updateMany({
    where: { ...whereBase, vencimento: { lt: agora } },
    data: { status: PagamentoStatus.ATRASADO },
  })

  const pendentes = await PagamentoRepository.updateMany({
    where: { ...whereBase, vencimento: { gte: agora } },
    data: { status: PagamentoStatus.PENDENTE },
  })

  const counts = await (PagamentoRepository.groupBy as any)({
    by: ['status'],
    where: { predioId, competencia: { gte: inicio, lte: fim } },
    _count: { _all: true },
  })

  return { updated: { atrasados: atrasados.count, pendentes: pendentes.count }, counts }
}

/**
 * @deprecated getResumoV2 está mantido apenas por compatibilidade com a UI atual.
 * - Mistura bases diferentes (receitas por Pagamento vs despesas por cadastro DespesaFixa)
 * - Os KPIs oficiais da Fase 1 devem usar getResumoV3 (tudo via Pagamento)
 */
export async function getResumoV2(predioId: string, competencia: string) {
  const { inicio, fim, competenciaStr } = parseCompetencia(competencia)

  const pagamentos = await prisma.pagamento.findMany({
    where: {
      unidade: { predioId },
      competencia: { gte: inicio, lte: fim },
    },
    select: {
      id: true,
      unidadeId: true,
      valor: true,
      status: true,
      vencimento: true,
      dataPagamento: true,
    },
  })

  const MS_DIA = 86_400_000
  const hoje = new Date()

  const linhas = pagamentos.map((p) => {
    const venc = new Date(p.vencimento)
    const vencido = p.status !== 'PAGO' && venc < hoje
    const statusUI: FinanceiroStatusUI = p.status === 'PAGO' ? 'PAGO' : vencido ? 'ATRASADO' : 'PENDENTE'
    const diasAtraso = vencido ? Math.max(0, Math.floor((+hoje - +venc) / MS_DIA)) : 0
    return { id: p.id, unidadeId: p.unidadeId, valor: Number(p.valor), statusUI, diasAtraso }
  })

  const totalDevido = pagamentos.reduce((acc, p) => acc + Number(p.valor), 0)
  const totalRecebido = pagamentos.filter((p) => p.status === 'PAGO').reduce((acc, p) => acc + Number(p.valor), 0)

  const todasUnidades = new Set(pagamentos.map((p) => p.unidadeId))
  const inadimplentes = new Set(linhas.filter((l) => l.statusUI === 'ATRASADO').map((l) => l.unidadeId))
  const inadimplenciaPct = todasUnidades.size === 0 ? 0 : (inadimplentes.size / todasUnidades.size) * 100

  const pendencias = linhas
    .filter((l) => l.statusUI !== 'PAGO')
    .map(({ id, unidadeId, valor, statusUI, diasAtraso }) => ({ id, unidadeId, valor, status: statusUI, diasAtraso }))

  // Despesas fixas ativas na competência
  const repoDF = (prisma as any).despesaFixa as { findMany?: Function } | undefined
  const despesasFixas = repoDF?.findMany
    ? await repoDF.findMany({
        where: {
          predioId,
          ativo: true,
          AND: [
            { inicio: { lte: fim } },
            { OR: [{ fim: null }, { fim: { gte: inicio } }] },
          ],
        },
        select: { valor: true },
      })
    : await prisma.$queryRaw<Array<{ valor: any }>>`
        SELECT "valor"
        FROM "DespesaFixa"
        WHERE "predioId" = ${predioId}
          AND "ativo" = true
          AND ("competenciaInicio" <= ${fim}
               AND ("competenciaFim" IS NULL OR "competenciaFim" >= ${inicio}))
      `
  const despesasFixasMes = (despesasFixas as Array<{ valor: Prisma.Decimal | number }>).reduce((acc: number, d: { valor: Prisma.Decimal | number }) => acc + Number(d.valor), 0)

  return {
    competencia: competenciaStr,
    kpis: {
      totalDevido: Number(totalDevido.toFixed(2)),
      totalRecebido: Number(totalRecebido.toFixed(2)),
      inadimplentes: inadimplentes.size,
      inadimplenciaPct: Number(inadimplenciaPct.toFixed(2)),
      despesasFixasMes: Number(despesasFixasMes.toFixed(2)),
      saldoPrevisto: Number((totalRecebido - despesasFixasMes).toFixed(2)),
    },
    pendencias,
  }
}

/**
 * getResumoV3
 * KPIs calculados integralmente a partir de Pagamento (livro-razão único).
 * - Previsto: receitas (TAXA_MENSAL) e despesas (DESPESA_FIXA/MANUTENCAO) da competência
 * - Realizado: receitas e despesas com status PagamentoStatus.PAGO
 * - Inadimplência: somente sobre TAXA_MENSAL
 * Guardrail arquitetural: NÃO consultar DespesaFixa aqui — KPIs devem SEMPRE derivar de Pagamento.
 * [LEGADO] despesasFixasMes (no bloco kpis) passa a ser derivado de Pagamento(DESPESA_FIXA) da competência.
 */
export async function getResumoV3(predioId: string, competencia: string) {
  const { inicio, fim, competenciaStr } = parseCompetenciaStrict(competencia)
  const MS_DIA = 86_400_000
  const hoje = new Date()

  // Receitas (TAXA_MENSAL) do mês
  const receitas = await prisma.pagamento.findMany({
    where: {
      predioId,
      competencia: { gte: inicio, lte: fim },
      tipo: PagamentoTipo.TAXA_MENSAL,
      unidadeId: { not: null }, // evita unidadeId nulo
      NOT: { status: PagamentoStatus.CANCELADO },
    },
    select: { id: true, unidadeId: true, valor: true, status: true, vencimento: true, dataPagamento: true },
  })

  // Despesas (DESPESA_FIXA e MANUTENCAO) do mês
  const despesas = await prisma.pagamento.findMany({
    where: {
      predioId,
      competencia: { gte: inicio, lte: fim },
      tipo: { in: [PagamentoTipo.DESPESA_FIXA, PagamentoTipo.MANUTENCAO] },
      NOT: { status: PagamentoStatus.CANCELADO },
    },
    select: { id: true, valor: true, status: true, vencimento: true, dataPagamento: true, tipo: true },
  })

  // KPIs - Previsto (competência)
  const receitasPrevistas = receitas.reduce((acc, p) => acc + Number(p.valor), 0)
  const despesasPrevistas = despesas.reduce((acc, p) => acc + Number(p.valor), 0)
  const saldoPrevisto = receitasPrevistas - despesasPrevistas

  // KPIs - Realizado (caixa)
  const receitasPagas = receitas
    .filter((p) => p.status === PagamentoStatus.PAGO)
    .reduce((acc, p) => acc + Number(p.valor), 0)
  const despesasPagas = despesas
    .filter((p) => p.status === PagamentoStatus.PAGO)
    .reduce((acc, p) => acc + Number(p.valor), 0)
  const saldoRealizado = receitasPagas - despesasPagas

  // Inadimplência (apenas sobre TAXA_MENSAL)
  const linhasReceita = receitas.map((p) => {
    const venc = new Date(p.vencimento)
    const vencido = p.status !== PagamentoStatus.PAGO && venc < hoje
    const statusUI: FinanceiroStatusUI =
      p.status === PagamentoStatus.PAGO ? 'PAGO' : vencido ? 'ATRASADO' : 'PENDENTE'
    const diasAtraso = vencido ? Math.max(0, Math.floor((+hoje - +venc) / MS_DIA)) : 0
    return { id: p.id, unidadeId: (p.unidadeId ?? '') as string, valor: Number(p.valor), statusUI, diasAtraso }
  })

  const todasUnidades = new Set(linhasReceita.map((l) => l.unidadeId).filter(Boolean))
  const inadimplentes = new Set(
    linhasReceita.filter((l) => l.statusUI === 'ATRASADO').map((l) => l.unidadeId)
  )
  const inadimplenciaPct = todasUnidades.size === 0 ? 0 : (inadimplentes.size / todasUnidades.size) * 100

  // [LEGADO] despesasFixasMes passa a vir de Pagamento(DESPESA_FIXA) na competência
  const despesasFixasPrevistas = despesas
    .filter((d) => d.tipo === PagamentoTipo.DESPESA_FIXA)
    .reduce((acc, d) => acc + Number(d.valor), 0)

  const pendencias = linhasReceita
    .filter((l) => l.statusUI !== 'PAGO')
    .map(({ id, unidadeId, valor, statusUI, diasAtraso }) => ({ id, unidadeId, valor, status: statusUI, diasAtraso }))

  return {
    competencia: competenciaStr,
    // Bloco legado mantido para compatibilidade com a UI atual
    kpis: {
      // @deprecated: bloco legado — preferir kpisPrevisto/kpisRealizado
      totalDevido: Number(receitasPrevistas.toFixed(2)),
      totalRecebido: Number(receitasPagas.toFixed(2)),
      inadimplentes: inadimplentes.size,
      inadimplenciaPct: Number(inadimplenciaPct.toFixed(2)),
      // [LEGADO] agora derivado de Pagamento(DESPESA_FIXA) da competência
      despesasFixasMes: Number(despesasFixasPrevistas.toFixed(2)),
      // [LEGADO] saldoPrevisto calculado com receitas previstas - despesas fixas previstas
      saldoPrevisto: Number((receitasPrevistas - despesasFixasPrevistas).toFixed(2)),
    },
    // Novos blocos para a UI futura
    kpisPrevisto: {
      receitasPrevistas: Number(receitasPrevistas.toFixed(2)),
      despesasPrevistas: Number(despesasPrevistas.toFixed(2)),
      saldoPrevisto: Number(saldoPrevisto.toFixed(2)),
    },
    kpisRealizado: {
      receitasPagas: Number(receitasPagas.toFixed(2)),
      despesasPagas: Number(despesasPagas.toFixed(2)),
      saldoRealizado: Number(saldoRealizado.toFixed(2)),
    },
    pendencias,
  }
}

export async function getPagamentos(
  predioId: string,
  competencia: string,
  status: 'PENDENCIAS' | 'PENDENTE' | 'ATRASADO' | 'PAGO' | 'TODOS'
) {
  const { inicio, fim } = parseCompetencia(competencia)

  const hoje = new Date()

  // Usa prisma diretamente para preservar tipos de include
  const rows = await prisma.pagamento.findMany({
    where: {
      predioId,
      competencia: { gte: inicio, lte: fim },
    },
    orderBy: [{ vencimento: 'asc' }, { createdAt: 'asc' }],
    include: { unidade: { select: { numero: true } } },
  })

  const itensAll = rows.map((r) => {
    const vencido = r.status !== 'PAGO' && r.vencimento < hoje
    const statusUI: FinanceiroStatusUI = r.status === 'PAGO' ? 'PAGO' : vencido ? 'ATRASADO' : 'PENDENTE'
    return {
      id: r.id,
      unidadeId: r.unidadeId,
      unidadeNome: r.unidade?.numero ? `Unidade ${r.unidade.numero}` : 'Condomínio',
      valor: Number(r.valor),
      status: statusUI,
      diasAtraso: vencido ? Math.max(0, Math.floor((+hoje - +r.vencimento) / 86_400_000)) : 0,
    }
  })

  const itens = ((): typeof itensAll => {
    switch (status) {
      case 'PENDENCIAS':
        return itensAll.filter((i) => i.status === 'PENDENTE' || i.status === 'ATRASADO')
      case 'PENDENTE':
      case 'ATRASADO':
      case 'PAGO':
        return itensAll.filter((i) => i.status === status)
      case 'TODOS':
      default:
        return itensAll
    }
  })()

  return { itens }
}

// Resumo financeiro por unidade na competência (não oficial global).
// Reutiliza o modelo oficial (Pagamentos) e helpers puros; não converte Decimal aqui.
export async function getResumoFinanceiroUnidade(unidadeId: string, competenciaStr: string) {
  const { inicio } = parseCompetencia(competenciaStr)
  const hoje = new Date()

  const pagamentos = await prisma.pagamento.findMany({
    where: { competencia: inicio, unidadeId },
    select: { id: true, unidadeId: true, valor: true, status: true, vencimento: true, tipo: true },
    orderBy: [{ vencimento: 'asc' }],
  })

  const totalDevido = pagamentos
    .filter((p) => p.status === PagamentoStatus.PENDENTE || p.status === PagamentoStatus.ATRASADO)
    .reduce((s, p) => new Prisma.Decimal(s).plus(p.valor), new Prisma.Decimal(0))

  const totalRecebido = pagamentos
    .filter((p) => p.status === PagamentoStatus.PAGO)
    .reduce((s, p) => new Prisma.Decimal(s).plus(p.valor), new Prisma.Decimal(0))

  const pendencias = pagamentos
    .filter((p) => p.status !== PagamentoStatus.PAGO)
    .map((p) => ({
      id: p.id,
      unidadeId: p.unidadeId,
      valor: p.valor,
      status: p.status,
      diasAtraso: isVencido(p.status, p.vencimento, hoje)
        ? Math.floor((+hoje - +p.vencimento) / 86_400_000)
        : 0,
    }))

  return {
    competencia: inicio,
    kpis: {
      totalDevido, // Prisma.Decimal
      totalRecebido, // Prisma.Decimal
      inadimplentes: pendencias.length ? 1 : 0,
      inadimplenciaPct: pendencias.length ? 100 : 0,
    },
    pendencias,
  }
}

export async function gerarLancamentosDespesasFixas(
  predioId: string,
  competencia: string,
  opts?: { sobrescrever?: boolean }
) {
  const { inicio, fim } = parseCompetencia(competencia)
  // ADR-007: bloqueio operacional simples para competência fechada
  // (impedir geração em competências fechadas)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  if (await (await import('@/server/financeiro/competencia-status.service')).isCompetenciaFechada(predioId, inicio)) {
    console.warn('[fechamento][despesas-fixas] competência fechada', { predioId, competencia: inicio.toISOString() })
    throw new Error('Competência fechada para operações de geração de despesas fixas')
  }
  // despesas ativas na competência
  const repoDF2 = (prisma as any).despesaFixa as { findMany?: Function } | undefined
  // Invariante: este método EMITE Pagamento(DESPESA_FIXA); não calcula KPIs nem aplica políticas
  const despesas = repoDF2?.findMany
    ? await repoDF2.findMany({
        where: {
          predioId,
          ativo: true,
          AND: [
            { inicio: { lte: fim } },
            { OR: [{ fim: null }, { fim: { gte: inicio } }] },
          ],
        },
        select: { id: true, valor: true, diaVencimento: true },
      })
    : await prisma.$queryRaw<Array<{ id: string; valor: any; diaVencimento: number }>>`
        SELECT "id", "valor", "diaVencimento"
        FROM "DespesaFixa"
        WHERE "predioId" = ${predioId}
          AND "ativo" = true
          AND (("competenciaInicio" <= ${fim})
               AND ("competenciaFim" IS NULL OR "competenciaFim" >= ${inicio}))
      `

  let created = 0
  let updated = 0
  let skipped = 0

  for (const d of despesas) {
    const venc = new Date(inicio.getFullYear(), inicio.getMonth(), d.diaVencimento)
    const existing = await PagamentoRepository.findFirst({
      where: { predioId, despesaFixaId: d.id, competencia: { gte: inicio, lte: endOfMonth(inicio) } } as any,
      select: { id: true },
    })
    if (existing) {
      if (opts?.sobrescrever) {
        await PagamentoRepository.update({ where: { id: existing.id }, data: {
          valor: d.valor, vencimento: venc, status: PagamentoStatus.PENDENTE,
        }})
        updated++
      } else {
        skipped++
      }
    } else {
      await PagamentoRepository.create({ data: ({
        predioId,
        // unidadeId intencionalmente omitido
        despesaFixaId: d.id as any,
        tipo: 'DESPESA_FIXA' as any,
        status: PagamentoStatus.PENDENTE,
        competencia: inicio,
        vencimento: venc,
        valor: d.valor as any,
      } as any) })
      created++
    }
  }

  return { created, updated, skipped, totalDespesas: despesas.length }
}

/**
 * Calcula e grava rateio de Despesa Fixa por unidade na competência.
 * - Idempotente por (unidadeId, competencia, origemTipo=DESPESA_FIXA, origemId=despesaId)
 * - Usa RegraRateio de cada despesa
 * - competência armazenada como primeiro dia do mês (00:00:00, horário local)
 */
export async function calcularRateioFixas(
  predioId: string,
  competencia: string,
  opts?: { sobrescrever?: boolean }
) {
  const { inicio, fim } = parseCompetencia(competencia)
  // ADR-007: bloqueio operacional simples para competência fechada
  // (impedir rateio em competências fechadas)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  if (await (await import('@/server/financeiro/competencia-status.service')).isCompetenciaFechada(predioId, inicio)) {
    console.warn('[fechamento][rateio-fixas] competência fechada', { predioId, competencia: inicio.toISOString() })
    throw new Error('Competência fechada para operações de rateio')
  }

  // Despesas fixas ativas na competência
  // Invariante: RateioItem é memória de cálculo; NÃO aplicar políticas (mínimo, fundo, exceções) aqui
  const despesas = await prisma.despesaFixa.findMany({
    where: {
      predioId,
      ativo: true,
      AND: [
        { inicio: { lte: fim } },
        { OR: [{ fim: null }, { fim: { gte: inicio } }] },
      ],
    },
    select: { id: true, valor: true, rateio: true },
  })

  if (despesas.length === 0) {
    return { created: 0, updated: 0, skipped: 0, totalDespesas: 0, totalUnidades: 0 }
  }

  const despesaIds = despesas.map((d) => d.id)

  // Unidades ativas do prédio (precisa de fracaoIdeal para rateio proporcional)
  const unidades = await prisma.unidade.findMany({
    where: { predioId, ativo: true },
    select: { id: true, fracaoIdeal: true },
  })

  // Valores por unidade para despesas de rateio VALOR_FIXO_POR_UNIDADE
  const valoresFixos = await prisma.despesaFixaValorPorUnidade.findMany({
    where: { despesaId: { in: despesaIds } },
    select: { despesaId: true, unidadeId: true, valor: true },
  })
  const valorFixoMap = new Map<string, Prisma.Decimal>() // key: despesaId|unidadeId
  for (const v of valoresFixos) {
    valorFixoMap.set(`${v.despesaId}|${v.unidadeId}`, v.valor as unknown as Prisma.Decimal)
  }

  // Pré-busca de RateioItem existentes para idempotência e performance
  const existentes = await prisma.rateioItem.findMany({
    where: {
      predioId,
      competencia: inicio,
      origemTipo: OrigemRateio.DESPESA_FIXA,
      origemId: { in: despesaIds },
    },
    select: { id: true, unidadeId: true, origemId: true },
  })
  const existenteMap = new Map<string, string>() // key: despesaId|unidadeId -> rateioItemId
  for (const e of existentes) existenteMap.set(`${e.origemId}|${e.unidadeId}`, e.id)

  let created = 0
  let updated = 0
  let skipped = 0

  // Pré-calcular soma da fração ideal (quando aplicável)
  const somaFracao = unidades.reduce((acc, u) => acc + (u.fracaoIdeal ?? 0), 0)

  const createData: Array<Prisma.RateioItemCreateManyInput> = []
  const updates: Array<{ id: string; valor: Prisma.Decimal }> = []

  for (const d of despesas) {
    const total = Number(d.valor)
    const porUnidade = new Map<string, number>()

    if (d.rateio === 'IGUAL') {
      const v = unidades.length > 0 ? total / unidades.length : 0
      for (const u of unidades) porUnidade.set(u.id, v)
    } else if (d.rateio === 'FRACAO_IDEAL') {
      if (somaFracao > 0) {
        for (const u of unidades) {
          const frac = u.fracaoIdeal ?? 0
          const v = total * (frac / somaFracao)
          porUnidade.set(u.id, v)
        }
      } else {
        const v = unidades.length > 0 ? total / unidades.length : 0
        for (const u of unidades) porUnidade.set(u.id, v)
      }
    } else if (d.rateio === 'VALOR_FIXO_POR_UNIDADE') {
      for (const u of unidades) {
        const key = `${d.id}|${u.id}`
        const vf = valorFixoMap.get(key)
        const v = vf ? Number(vf as unknown as number) : 0
        porUnidade.set(u.id, v)
      }
    } else {
      // fallback seguro: dividir igualmente
      const v = unidades.length > 0 ? total / unidades.length : 0
      for (const u of unidades) porUnidade.set(u.id, v)
    }

    for (const u of unidades) {
      const valorUnit = porUnidade.get(u.id) ?? 0
      // opcional: pular zero para reduzir ruído
      if (!valorUnit || valorUnit === 0) { skipped++; continue }

      const key = `${d.id}|${u.id}`
      const existingId = existenteMap.get(key)
      if (existingId) {
        if (opts?.sobrescrever) {
          updates.push({ id: existingId, valor: new Prisma.Decimal(valorUnit) })
          updated++
        } else {
          skipped++
        }
      } else {
        createData.push({
          predioId,
          competencia: inicio,
          unidadeId: u.id,
          origemTipo: OrigemRateio.DESPESA_FIXA,
          origemId: d.id,
          descricao: 'Despesa Fixa',
          valor: new Prisma.Decimal(valorUnit) as unknown as any,
          natureza: NaturezaLancamento.DEBITO,
          criadoPor: null,
        })
        created++
      }
    }
  }

  if (createData.length > 0) {
    await prisma.rateioItem.createMany({ data: createData, skipDuplicates: true })
  }
  for (const up of updates) {
    await prisma.rateioItem.update({ where: { id: up.id }, data: { valor: up.valor } })
  }

  return { created, updated, skipped, totalDespesas: despesas.length, totalUnidades: unidades.length }
}

/**
 * Gera Pagamento(TAXA_MENSAL) por unidade, exclusivamente a partir de RateioItem (+ AjusteUnidade) da competência.
 * - Competência: sempre o primeiro dia do mês (parseCompetencia)
 * - Idempotência por (unidadeId + competencia + tipo=TAXA_MENSAL)
 * - Não sobrescreve pagamentos com status PAGO
 * - Unidades sem RateioItem NÃO geram cobrança nesta fase (Fase 3 tratará mínimos/fundo)
 */
// INVARIANTE (ADR-003):
// Valor final da cobrança = sum(RateioItem) + sum(AjusteUnidade).
// NUNCA aplicar políticas diretamente em Pagamento.
export async function gerarCobrancasPorRateio(
  predioId: string,
  competencia: string,
  opts: { sobrescrever: boolean }
) {
  const { inicio } = parseCompetencia(competencia) // padrão: primeiro dia do mês
  // ADR-007: bloqueio operacional simples para competência fechada
  // (impedir consolidação em competências fechadas)
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  if (await (await import('@/server/financeiro/competencia-status.service')).isCompetenciaFechada(predioId, inicio)) {
    console.warn('[fechamento][cobrancas-por-rateio] competência fechada', { predioId, competencia: inicio.toISOString() })
    throw new Error('Competência fechada para operações de cobrança')
  }

  // Somatório de RateioItem por unidade na competência
  const rateios = await prisma.rateioItem.groupBy({
    by: ['unidadeId'],
    where: { predioId, competencia: inicio },
    _sum: { valor: true },
  })

  if (rateios.length === 0) {
    return { created: 0, updated: 0, skipped: 0, totalUnidades: 0 }
  }

  // Ajustes por unidade (DEBITO soma, CREDITO subtrai)
  const ajustesRows = await prisma.ajusteUnidade.findMany({
    where: { predioId, competencia: inicio },
    select: { unidadeId: true, valor: true, natureza: true },
  })
  const ajustesMap = new Map<string, Prisma.Decimal>()
  for (const a of ajustesRows) {
    const prev = ajustesMap.get(a.unidadeId) ?? new Prisma.Decimal(0)
    const delta = new Prisma.Decimal(a.valor as unknown as any)
    const next = a.natureza === 'DEBITO' ? prev.plus(delta) : prev.minus(delta)
    ajustesMap.set(a.unidadeId, next)
  }

  // Universo de unidades a cobrar = apenas as que têm rateio (limitação explícita da Fase 2)
  const unidadesIds = rateios.map((r) => r.unidadeId)

  // Pré-buscar pagamentos existentes dessa competência
  const existentes = await PagamentoRepository.findMany({
    where: {
      predioId,
      tipo: PagamentoTipo.TAXA_MENSAL,
      competencia: inicio,
      unidadeId: { in: unidadesIds },
    },
    select: { id: true, unidadeId: true, status: true },
  })
  const pagPorUnidade = new Map<string, { id: string; status: PagamentoStatus }>()
  for (const p of existentes) pagPorUnidade.set(p.unidadeId!, { id: p.id, status: p.status })

  let created = 0
  let updated = 0
  let skipped = 0

  const creates: Array<Prisma.PagamentoCreateManyInput> = []
  const updates: Array<{ id: string; valor: Prisma.Decimal }> = []

  for (const r of rateios) {
    const unidadeId = r.unidadeId!
    const base = new Prisma.Decimal(r._sum.valor || 0)
    const aj = ajustesMap.get(unidadeId) ?? new Prisma.Decimal(0)
    const total = base.plus(aj)

    // Se total <= 0, evita gerar cobrança inútil
    if (!total.gt(0)) { skipped++; continue }

    const existing = pagPorUnidade.get(unidadeId)
    if (existing) {
      if (!opts.sobrescrever) { skipped++; continue }
      if (existing.status === PagamentoStatus.PAGO) { skipped++; continue }
      updates.push({ id: existing.id, valor: total })
      updated++
    } else {
      const venc = new Date(inicio.getFullYear(), inicio.getMonth(), 10) // dia padrão (10)
      creates.push({
        predioId,
        unidadeId,
        tipo: PagamentoTipo.TAXA_MENSAL,
        status: PagamentoStatus.PENDENTE,
        competencia: inicio,
        vencimento: venc,
        valor: total as unknown as any,
      })
      created++
    }
  }

  if (creates.length > 0) {
    await PagamentoRepository.createMany({ data: creates, skipDuplicates: true })
  }
  for (const u of updates) {
    await PagamentoRepository.update({ where: { id: u.id }, data: { valor: u.valor } })
  }

  return { created, updated, skipped, totalUnidades: unidadesIds.length }
}

// CRUD de Despesa Fixa
export interface DespesaFixaDTO {
  id: string
  predioId: string
  nome: string
  valor: number
  diaVencimento: number
  categoria?: string | null
  dataInicio?: Date | null
  dataFim?: Date | null
  ativo: boolean
}

export async function getDespesasFixas(predioId: string): Promise<any[]> {
  const rows = await prisma.despesaFixa.findMany({
    where: { predioId },
    orderBy: { inicio: 'desc' },
    select: {
      id: true,
      predioId: true,
      nome: true,
      valor: true,
      categoria: true,
      inicio: true,
      fim: true,
      ativo: true,
      diaVencimento: true,
    },
  })

  return rows.map((r) => ({
    id: r.id,
    predioId: r.predioId,
    nome: r.nome,
    valor: Number(r.valor as unknown as number),
    categoria: r.categoria ?? null,
    inicio: r.inicio ?? null,
    fim: r.fim ?? null,
    ativo: r.ativo,
    diaVencimento: r.diaVencimento ?? null,
  }))
}

export async function createDespesaFixa(predioId: string, data: {
  nome: string
  valor: number
  diaVencimento: number
  categoria?: string | null
  dataInicio?: Date | null
  dataFim?: Date | null
  ativo?: boolean
}): Promise<DespesaFixaDTO> {
  const created = await prisma.despesaFixa.create({
    data: {
      predioId,
      nome: data.nome,
      valor: data.valor as any,
      diaVencimento: data.diaVencimento,
      categoria: data.categoria ?? '',
      inicio: data.dataInicio ?? new Date(),
      fim: data.dataFim ?? null,
      ativo: data.ativo ?? true,
    },
    select: {
      id: true,
      predioId: true,
      nome: true,
      valor: true,
      diaVencimento: true,
      categoria: true,
      inicio: true,
      fim: true,
      ativo: true,
    },
  })

  return {
    id: created.id,
    predioId: created.predioId,
    nome: created.nome,
    valor: Number(created.valor as unknown as number),
    diaVencimento: created.diaVencimento as number,
    categoria: created.categoria ?? null,
    dataInicio: created.inicio ?? null,
    dataFim: created.fim ?? null,
    ativo: created.ativo,
  }
}

export async function updateDespesaFixa(
  despesaId: string,
  data: Partial<Omit<DespesaFixaDTO, 'id' | 'predioId'>>
): Promise<DespesaFixaDTO> {
  const dataUpdate: any = {}
  if (data.nome !== undefined) dataUpdate.nome = data.nome
  if (data.valor !== undefined) dataUpdate.valor = data.valor as any
  if (data.diaVencimento !== undefined) dataUpdate.diaVencimento = data.diaVencimento
  if (data.categoria !== undefined) dataUpdate.categoria = data.categoria ?? ''
  if (data.dataInicio !== undefined) dataUpdate.inicio = data.dataInicio
  if (data.dataFim !== undefined) dataUpdate.fim = data.dataFim
  if (data.ativo !== undefined) dataUpdate.ativo = data.ativo

  const row = Object.keys(dataUpdate).length === 0
    ? await prisma.despesaFixa.findUnique({
        where: { id: despesaId },
        select: {
          id: true,
          predioId: true,
          nome: true,
          valor: true,
          diaVencimento: true,
          categoria: true,
          inicio: true,
          fim: true,
          ativo: true,
        },
      })
    : await prisma.despesaFixa.update({
        where: { id: despesaId },
        data: dataUpdate,
        select: {
          id: true,
          predioId: true,
          nome: true,
          valor: true,
          diaVencimento: true,
          categoria: true,
          inicio: true,
          fim: true,
          ativo: true,
        },
      })

  if (!row) throw new Error('Despesa fixa não encontrada')

  return {
    id: row.id,
    predioId: row.predioId,
    nome: row.nome,
    valor: Number(row.valor as unknown as number),
    diaVencimento: row.diaVencimento as number,
    categoria: row.categoria ?? null,
    dataInicio: row.inicio ?? null,
    dataFim: row.fim ?? null,
    ativo: row.ativo,
  }
}

export async function deleteDespesaFixa(despesaId: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "DespesaFixa" WHERE "id" = ${despesaId}`
}





