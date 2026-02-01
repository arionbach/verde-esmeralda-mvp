// src/app/api/predios/[id]/financeiro/competencia/status/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { ok, bad, handlePrismaError } from '@/app/api/_utils'
import { parseCompetenciaYYMM } from '@/server/financeiro/gerador-pagamentos.service'
import { isCompetenciaFechada } from '@/server/financeiro/competencia-status.service'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    const competenciaStrParam = new URL(req.url).searchParams.get('competencia') || ''
    if (!competenciaStrParam || competenciaStrParam.length < 7) return bad('Competência inválida (YYYY-MM)')
    const { inicio, competenciaStr } = parseCompetenciaYYMM(competenciaStrParam)
    const fechada = await isCompetenciaFechada(predioId, inicio)
    return ok({ predioId, competencia: competenciaStr, status: fechada ? 'FECHADA' : 'ABERTA' })
  } catch (err) {
    return handlePrismaError(err)
  }
}
