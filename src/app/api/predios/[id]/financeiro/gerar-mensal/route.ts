// src/app/api/predios/[id]/financeiro/gerar-mensal/route.ts
import { NextRequest } from 'next/server'
import { ok, bad, handlePrismaError } from '@/app/api/_utils'
import { gerarPagamentosDaCompetencia, parseCompetenciaYYMM } from '@/server/financeiro/gerador-pagamentos.service'

type Ctx = { params: { id: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = params
    const { searchParams } = new URL(req.url)
    const competenciaStr = searchParams.get('competencia') || ''
    if (!competenciaStr || competenciaStr.length < 7) return bad('competencia inválida (YYYY-MM)')
    // valida formato antes de seguir
    parseCompetenciaYYMM(competenciaStr)
    const usuario = req.headers.get('x-user') || 'system'
    const result = await gerarPagamentosDaCompetencia(predioId, competenciaStr, usuario)
    return ok(result)
  } catch (err) {
    return handlePrismaError(err)
  }
}

