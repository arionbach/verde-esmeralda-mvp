// src/server/financeiro/consolidacao.service.ts
// Y.2.1 - Consolidação Financeira por Prédio (BASE)
// Regras do Modelo Financeiro A:
// - Receita oficial deriva exclusivamente de Pagamento (livro‑razão)
// - Consolidação é leitura + agregação (sem criar/alterar Pagamento)
// - Conversão Decimal -> number ocorre aqui (no service)

import { PagamentoRepository } from '@/server/repositories/PagamentoRepository'
import { PagamentoStatus, PagamentoTipo } from '@prisma/client'
import { endOfMonth } from 'date-fns'

export type ConsolidacaoFinanceiraPredio = {
  competencia: Date
  receitaPrevista: number
  receitaRealizada: number
  receitaEmAberto: number
  receitaAtrasada: number
}

export async function getConsolidacaoFinanceiraPredio(
  predioId: string,
  competencia: Date
): Promise<ConsolidacaoFinanceiraPredio> {
  const inicio = competencia
  const fim = endOfMonth(competencia)

  const agg = await PagamentoRepository.aggregate({
    _sum: { valor: true },
    where: {
      predioId,
      competencia: { gte: inicio, lte: fim },
      tipo: PagamentoTipo.TAXA_MENSAL,
      NOT: { status: PagamentoStatus.CANCELADO },
    },
  })

  const aggRealizada = await PagamentoRepository.aggregate({
    _sum: { valor: true },
    where: {
      predioId,
      competencia: { gte: inicio, lte: fim },
      tipo: PagamentoTipo.TAXA_MENSAL,
      status: PagamentoStatus.PAGO,
      NOT: { status: PagamentoStatus.CANCELADO },
    },
  })

  const aggEmAberto = await PagamentoRepository.aggregate({
    _sum: { valor: true },
    where: {
      predioId,
      competencia: { gte: inicio, lte: fim },
      tipo: PagamentoTipo.TAXA_MENSAL,
      status: PagamentoStatus.PENDENTE,
      NOT: { status: PagamentoStatus.CANCELADO },
    },
  })

  const aggAtrasada = await PagamentoRepository.aggregate({
    _sum: { valor: true },
    where: {
      predioId,
      competencia: { gte: inicio, lte: fim },
      tipo: PagamentoTipo.TAXA_MENSAL,
      status: PagamentoStatus.ATRASADO,
      NOT: { status: PagamentoStatus.CANCELADO },
    },
  })

  const receitaPrevista = Number(agg._sum?.valor ?? 0)
  const receitaRealizada = Number(aggRealizada._sum?.valor ?? 0)
  const receitaEmAberto = Number(aggEmAberto._sum?.valor ?? 0)
  const receitaAtrasada = Number(aggAtrasada._sum?.valor ?? 0)

  return { competencia: inicio, receitaPrevista, receitaRealizada, receitaEmAberto, receitaAtrasada }
}
