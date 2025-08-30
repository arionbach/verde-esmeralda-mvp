// src/app/api/predios/%5Bid%5D/financeiro/pagamentos/route.ts
import { NextRequest } from 'next/server'
import { ok, bad, handlePrismaError, isValidUUID } from '@/app/api/_utils'
import { listPagamentos } from '@/server/financeiro.service'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID inválido')

    const { searchParams } = new URL(req.url)
    const competenciaStr = searchParams.get('competencia')
    const status = (searchParams.get('status') || 'PENDENCIAS').toUpperCase()

    if (!competenciaStr) return bad('competencia (YYYY-MM) obrigatória')

    const data = await listPagamentos(predioId, competenciaStr, status as any)
    return ok(data)
  } catch (err) {
    console.error('[GET /financeiro/pagamentos]', err)
    return handlePrismaError(err)
  }
}
