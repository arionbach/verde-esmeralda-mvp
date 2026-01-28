// src/app/api/predios/[id]/financeiro/rateio/fixas/route.ts
import { NextRequest } from 'next/server'
import { bad, ok, handlePrismaError, isValidUUID } from '@/app/api/_utils'
import { calcularRateioFixas } from '@/server/financeiro/financeiro.service'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID inválido')

    const { searchParams } = new URL(req.url)
    const competencia = searchParams.get('competencia') || ''
    if (!competencia || competencia.length < 7) return bad('Competência inválida (YYYY-MM)')
    const sobrescrever = searchParams.get('sobrescrever') === '1'

    const result = await calcularRateioFixas(predioId, competencia, { sobrescrever })
    return ok({ competencia, ...result })
  } catch (err) {
    console.error('[rateio/fixas]', err)
    if (err instanceof Error && 'code' in err) {
      return handlePrismaError(err)
    }
    return bad('Erro ao calcular rateio de despesas fixas')
  }
}
