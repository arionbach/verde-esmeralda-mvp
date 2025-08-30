// src/server/financeiro.service.ts
import prisma from '@/lib/prisma'
import { PagamentoStatus, PagamentoTipo, Prisma } from '@prisma/client'
import { startOfMonth, endOfMonth, parse } from 'date-fns'

export type FinanceiroStatusUI = 'PENDENTE' | 'ATRASADO' | 'PAGO'

export function parseCompetencia(competencia: string) {
  // aceita 'YYYY-MM' ou datas que comecem com esse formato
  const base = competencia?.slice(0, 7)
  const comp = parse(base, 'yyyy-MM', new Date())
  if (isNaN(comp.getTime())) {
    throw new Error('Competência inválida. Use YYYY-MM')
  }
  return {
    competenciaStr: base,
    inicio: startOfMonth(comp),
    fim: endOfMonth(comp),
  }
}

export async function gerarMensalidades(
  predioId: string,
  competencia: string,
  opts?: { vencimentoDia?: number; valorPadrao?: number; sobrescrever?: boolean }
) {
  const { inicio, fim, competenciaStr } = parseCompetencia(competencia)
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

    const existing = await prisma.pagamento.findFirst({
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
        await prisma.pagamento.update({
          where: { id: existing.id },
          data: { valor, vencimento, status: PagamentoStatus.PENDENTE },
        })
        updated++
      } else {
        skipped++
      }
    } else {
      await prisma.pagamento.create({
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

export async function recalcularStatus(predioId: string, competencia: string) {
  const { inicio, fim } = parseCompetencia(competencia)
  const agora = new Date()

  const whereBase: Prisma.PagamentoWhereInput = {
    predioId,
    competencia: { gte: inicio, lte: fim },
    NOT: { status: PagamentoStatus.PAGO },
  }

  const atrasados = await prisma.pagamento.updateMany({
    where: { ...whereBase, vencimento: { lt: agora } },
    data: { status: PagamentoStatus.ATRASADO },
  })

  const pendentes = await prisma.pagamento.updateMany({
    where: { ...whereBase, vencimento: { gte: agora } },
    data: { status: PagamentoStatus.PENDENTE },
  })

  const counts = await prisma.pagamento.groupBy({
    by: ['status'],
    where: { predioId, competencia: { gte: inicio, lte: fim } },
    _count: { _all: true },
  })

  return { updated: { atrasados: atrasados.count, pendentes: pendentes.count }, counts }
}

export async function getResumo(predioId: string, competencia: string) {
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

  return {
    competencia: competenciaStr,
    kpis: {
      totalDevido: Number(totalDevido.toFixed(2)),
      totalRecebido: Number(totalRecebido.toFixed(2)),
      inadimplentes: inadimplentes.size,
      inadimplenciaPct: Number(inadimplenciaPct.toFixed(2)),
    },
    pendencias,
  }
}

export async function listPagamentos(
  predioId: string,
  competencia: string,
  status: 'PENDENCIAS' | 'PENDENTE' | 'ATRASADO' | 'PAGO' | 'TODOS'
) {
  const { inicio, fim } = parseCompetencia(competencia)

  const hoje = new Date()

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
      unidadeNome: r.unidade?.numero ? `Unidade ${r.unidade.numero}` : undefined,
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

