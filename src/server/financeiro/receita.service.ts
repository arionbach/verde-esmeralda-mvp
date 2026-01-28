// src/server/financeiro/receita.service.ts
// Service dedicado para cálculo de receita mensal por prédio (Modelo Financeiro A)
// Regra: receita oficial deriva exclusivamente de Pagamento
// Conversão Decimal -> number ocorre aqui (boundary do service)

import { PagamentoStatus, PagamentoTipo } from '@prisma/client'
import { endOfMonth } from 'date-fns'
import { PagamentoRepository } from '@/server/repositories/PagamentoRepository'

export async function getReceitaMensalPredio(
  predioId: string,
  competencia: Date // startOfMonth
): Promise<number> {
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

  return Number(agg._sum.valor ?? 0)
}
