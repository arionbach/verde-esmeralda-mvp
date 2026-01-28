import { NextRequest } from 'next/server'
import { ok, bad, handlePrismaError, isValidUUID } from '@/app/api/_utils'
import { gerarMensalidades } from '@/server/financeiro/financeiro.service'

type RouteCtx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID do prédio inválido')

    const { searchParams } = new URL(req.url)
    const competenciaStr = searchParams.get('competencia')
    if (!competenciaStr || competenciaStr.length < 7) {
      return bad('Competência inválida. Use YYYY-MM')
    }

    const valorPadrao = Number(searchParams.get('valorPadrao') ?? '0') || 0
    const sobrescrever = searchParams.get('sobrescrever') !== '0'
    const result = await gerarMensalidades(predioId, competenciaStr, {
      valorPadrao,
      sobrescrever,
    })
    return ok(result)
  } catch (err) {
    console.error('[POST /financeiro/mensalidades]', err)
    return handlePrismaError(err)
  }
}
