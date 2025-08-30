// src/app/api/predios/[id]/financeiro/recalcular/route.ts
import { NextRequest } from 'next/server'
import { isValidUUID, ok, bad, handlePrismaError } from '@/app/api/_utils'
import { z } from 'zod'
import { recalcularStatus } from '@/server/financeiro.service'

const QuerySchema = z.object({
  competencia: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM'),
})

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID inválido')

    const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
    if (!parsed.success) return bad('Competência inválida. Use YYYY-MM')

    const competenciaStr = parsed.data.competencia
    const result = await recalcularStatus(predioId, competenciaStr)
    return ok({ competencia: competenciaStr, ...result })
  } catch (err) {
    console.error('[POST /financeiro/recalcular]', err)
    return handlePrismaError(err)
  }
}

