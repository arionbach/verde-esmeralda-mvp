// Endpoint técnico (sem UI) para fechar/abrir competência operacional (ADR-007)
import { NextRequest } from 'next/server'
import { isValidUUID, ok, bad, handlePrismaError } from '@/app/api/_utils'
import { parseCompetencia } from '@/server/financeiro/financeiro.service'
import { setCompetenciaStatus } from '@/server/financeiro/competencia-status.service'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID inválido')

    const { searchParams } = new URL(req.url)
    const competenciaStr = searchParams.get('competencia') || ''
    if (!competenciaStr || competenciaStr.length < 7) return bad('Competência inválida (YYYY-MM)')

    const status = (searchParams.get('status') || 'FECHADA').toUpperCase()
    if (status !== 'FECHADA' && status !== 'ABERTA') return bad('Status inválido. Use ABERTA ou FECHADA')

    const usuario = searchParams.get('usuario') || req.headers.get('x-user') || 'system'
    const { inicio } = parseCompetencia(competenciaStr)

    const row = await setCompetenciaStatus({ predioId, competencia: inicio, status: status as any, usuario })

    return ok({
      predioId: row.predioId,
      competencia: row.competencia,
      status: row.status,
      fechadaEm: row.fechadaEm,
      fechadaPor: row.fechadaPor,
    })
  } catch (err) {
    console.error('[fechamento/competencia]', err)
    if (err instanceof Error && 'code' in err) return handlePrismaError(err)
    return bad('Erro ao alterar status da competência')
  }
}
