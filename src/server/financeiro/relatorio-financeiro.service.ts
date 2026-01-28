// src/server/financeiro/relatorio-financeiro.service.ts
// Y.4.1 - Relatório Financeiro Mensal por Prédio (leitura/composição leve)
// Baseado EXCLUSIVAMENTE na consolidação existente (Modelo Financeiro A)
// Sem acesso direto ao Prisma; delega ao consolidacao.service

import { getConsolidacaoFinanceiraPredio } from '@/server/financeiro/consolidacao.service'

export type RelatorioFinanceiroMensalPredio = {
  competencia: Date
  receitaPrevista: number
  receitaRealizada: number
  receitaEmAberto: number
  receitaAtrasada: number
  percentualInadimplencia: number
}

export async function getRelatorioFinanceiroMensalPredio(
  predioId: string,
  competencia: Date
): Promise<RelatorioFinanceiroMensalPredio> {
  const base = await getConsolidacaoFinanceiraPredio(predioId, competencia)

  const numPrev = Number(base.receitaPrevista ?? 0)
  const numAberto = Number(base.receitaEmAberto ?? 0)
  const numAtrasado = Number(base.receitaAtrasada ?? 0)
  const percentualInadimplencia = numPrev > 0 ? (numAberto + numAtrasado) / numPrev : 0

  return {
    competencia: base.competencia,
    receitaPrevista: Number(base.receitaPrevista ?? 0),
    receitaRealizada: Number(base.receitaRealizada ?? 0),
    receitaEmAberto: Number(base.receitaEmAberto ?? 0),
    receitaAtrasada: Number(base.receitaAtrasada ?? 0),
    percentualInadimplencia,
  }
}

