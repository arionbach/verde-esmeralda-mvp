// src/server/financeiro.politicas.service.ts
// GOVERNANÇA (Políticas de Cobrança)
// - Políticas (taxa mínima, fundo de reserva, exceções) são aplicadas via AjusteUnidade
// - Não alteram RateioItem (memória de cálculo) nem Pagamento diretamente nesta fase
// - Competência sempre explícita (startOfMonth) e por unidade/predio
// - Decimal interno; conversão apenas no boundary
// - route.ts delega; este service decide políticas, respeitando ADRs vigentes
import { prisma } from '@/lib/prisma'
import { Prisma, NaturezaLancamento, TipoPoliticaAjuste } from '@prisma/client'

/**
 * FASE 3 — Service de Políticas de Cobrança
 *
 * Objetivo: Inserir políticas (taxa mínima, fundo de reserva, exceções) via AjusteUnidade
 * entre o rateio e a geração de cobranças, SEM tocar em RateioItem, Pagamento, UI ou legado.
 *
 * Regras (ADR-003 / ADR-005 / ADR-006):
 * - AjusteUnidade é o ÚNICO veículo para políticas de cobrança.
 * - Criado sempre por competência (startOfMonth) e unidade.
 * - tipoPolitica identifica semanticamente a política (TAXA_MINIMA, FUNDO_RESERVA, EXCECAO).
 * - Não é chamado automaticamente nesta fase; integração no pipeline virá depois.
 * - ADR-005: verificação de “competência fechada” ainda NÃO está implementada nesta fase (guardrail pendente).
 */
export async function calcularPoliticasDoMes(params: {
  predioId: string
  competencia: Date // startOfMonth obrigatório
}): Promise<void> {
  // Observação (ADR-005): verificação de "competência fechada" ainda não implementada nesta fase.

  // Política: TAXA MÍNIMA — somente via AjusteUnidade
  // Regras obrigatórias:
  // - Usar exclusivamente AjusteUnidade (natureza = DEBITO)
  // - Identificar por tipoPolitica = TAXA_MINIMA (nunca por descrição)
  // - NÃO alterar RateioItem
  // - NÃO criar/alterar Pagamento
  // - Trabalhar por (predioId, unidadeId, competencia = startOfMonth)
  // - Idempotência: único ajuste por (predioId, unidadeId, competencia, tipoPolitica)
  // - Decimal em todos os cálculos (Prisma.Decimal)
  // - Se (mínimo − base) <= 0, pular (skipped)
  // - descricao apenas para auditoria (texto livre)

  const { predioId } = params
  const c = params.competencia
  const competencia = new Date(c.getFullYear(), c.getMonth(), 1) // normaliza para startOfMonth

  // Fonte do mínimo (piloto global): R$ 100,00 — política reversível ajustando apenas esta constante
  const MINIMO = new Prisma.Decimal('100.00')

  // Somatório de RateioItem por unidade na competência
  const grupos = await prisma.rateioItem.groupBy({
    by: ['unidadeId'],
    where: { predioId, competencia },
    _sum: { valor: true },
  })

  if (grupos.length === 0) {
    console.log('[politicas][taxa-minima]', { predioId, competencia: competencia.toISOString(), created: 0, updated: 0, skipped: 0, totalUnidades: 0 })
    return
  }

  const unidadeIds = grupos.map((g) => g.unidadeId!).filter(Boolean) as string[]

  // Idempotência: pré-buscar ajustes existentes desta política
  const existentes = await prisma.ajusteUnidade.findMany({
    where: {
      predioId,
      competencia,
      tipoPolitica: TipoPoliticaAjuste.TAXA_MINIMA,
      unidadeId: { in: unidadeIds },
    },
    select: { id: true, unidadeId: true },
  })
  const mapExistente = new Map<string, string>() // unidadeId -> ajusteId
  for (const a of existentes) mapExistente.set(a.unidadeId, a.id)

  let created = 0
  let updated = 0
  let skipped = 0

  const creates: Prisma.AjusteUnidadeCreateManyInput[] = []
  const updates: Array<{ id: string; valor: Prisma.Decimal; descricao: string }> = []

  for (const g of grupos) {
    const unidadeId = g.unidadeId!
    const base = new Prisma.Decimal(g._sum.valor ?? 0)
    const delta = MINIMO.minus(base)
    if (!delta.gt(0)) { skipped++; continue }

    const descricao = `Taxa mínima — competência ${competencia.toISOString().slice(0, 7)} — base R$ ${base.toFixed(2)} — mínimo R$ ${MINIMO.toFixed(2)}`

    const existentId = mapExistente.get(unidadeId)
    if (existentId) {
      updates.push({ id: existentId, valor: delta, descricao })
      updated++
    } else {
      creates.push({
        predioId,
        unidadeId,
        competencia,
        tipoPolitica: TipoPoliticaAjuste.TAXA_MINIMA,
        natureza: NaturezaLancamento.DEBITO,
        valor: delta,
        descricao,
      })
      created++
    }
  }

  if (creates.length > 0) {
    // skipDuplicates só terá efeito pleno após índice único por (predioId, unidadeId, competencia, tipoPolitica) — ver ADR-004
    await prisma.ajusteUnidade.createMany({ data: creates, skipDuplicates: true })
  }
  for (const u of updates) {
    await prisma.ajusteUnidade.update({ where: { id: u.id }, data: { valor: u.valor, descricao: u.descricao, tipoPolitica: TipoPoliticaAjuste.TAXA_MINIMA, natureza: NaturezaLancamento.DEBITO } })
  }

  console.log('[politicas][taxa-minima]', { predioId, competencia: competencia.toISOString(), created, updated, skipped, totalUnidades: grupos.length })

  // =====================
  // FUNDO DE RESERVA
  // =====================
  // Percentual global (piloto)
  const PCT_FUNDO = new Prisma.Decimal('0.05')

  // Idempotência: pré-buscar ajustes existentes desta política (FUNDO_RESERVA)
  const existentesFundo = await prisma.ajusteUnidade.findMany({
    where: {
      predioId,
      competencia,
      tipoPolitica: TipoPoliticaAjuste.FUNDO_RESERVA,
      unidadeId: { in: unidadeIds },
    },
    select: { id: true, unidadeId: true },
  })
  const mapExistenteFundo = new Map<string, string>() // unidadeId -> ajusteId (fundo)
  for (const a of existentesFundo) mapExistenteFundo.set(a.unidadeId, a.id)

  let createdFundo = 0
  let updatedFundo = 0
  let skippedFundo = 0

  const createsFundo: Prisma.AjusteUnidadeCreateManyInput[] = []
  const updatesFundo: Array<{ id: string; valor: Prisma.Decimal; descricao: string }> = []

  for (const g of grupos) {
    const unidadeId = g.unidadeId!
    const base = new Prisma.Decimal(g._sum.valor ?? 0)
    // fundo bruto = base * pct
    const bruto = base.times(PCT_FUNDO)
    // arredondar para 2 casas decimais
    const arredondado = new Prisma.Decimal(bruto.toFixed(2))
    if (!arredondado.gt(0)) { skippedFundo++; continue }

    const percentualTxt = PCT_FUNDO.times(100).toFixed(2) + '%'
    const descricaoFundo = `Fundo de Reserva — ${percentualTxt} da base R$ ${base.toFixed(2)} — competência ${competencia.toISOString().slice(0, 7)}`

    const existentId = mapExistenteFundo.get(unidadeId)
    if (existentId) {
      updatesFundo.push({ id: existentId, valor: arredondado, descricao: descricaoFundo })
      updatedFundo++
    } else {
      createsFundo.push({
        predioId,
        unidadeId,
        competencia,
        tipoPolitica: TipoPoliticaAjuste.FUNDO_RESERVA,
        natureza: NaturezaLancamento.DEBITO,
        valor: arredondado,
        descricao: descricaoFundo,
      })
      createdFundo++
    }
  }

  if (createsFundo.length > 0) {
    // skipDuplicates só terá efeito pleno após índice único por (predioId, unidadeId, competencia, tipoPolitica) — ver ADR-004
    await prisma.ajusteUnidade.createMany({ data: createsFundo, skipDuplicates: true })
  }
  for (const u of updatesFundo) {
    await prisma.ajusteUnidade.update({ where: { id: u.id }, data: { valor: u.valor, descricao: u.descricao, tipoPolitica: TipoPoliticaAjuste.FUNDO_RESERVA, natureza: NaturezaLancamento.DEBITO } })
  }

  console.log('[politicas][fundo-reserva]', { predioId, competencia: competencia.toISOString(), created: createdFundo, updated: updatedFundo, skipped: skippedFundo, totalUnidades: grupos.length })
}
