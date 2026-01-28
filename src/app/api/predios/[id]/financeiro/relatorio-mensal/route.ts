// src/app/api/predios/[id]/financeiro/relatorio-mensal/route.ts
import { NextRequest } from 'next/server'
import { ok, bad, handlePrismaError } from '@/app/api/_utils'
import { parseCompetencia } from '@/server/financeiro/financeiro.service'
import { getRelatorioFinanceiroMensalPredio } from '@/server/financeiro/relatorio-financeiro.service'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    const competenciaStr = new URL(req.url).searchParams.get('competencia')
    if (!competenciaStr) return bad('competencia (YYYY-MM) é obrigatória')

    const { inicio } = parseCompetencia(competenciaStr)
    const data = await getRelatorioFinanceiroMensalPredio(predioId, inicio)
    return ok(data)
  } catch (err) {
    return handlePrismaError(err)
  }
}

