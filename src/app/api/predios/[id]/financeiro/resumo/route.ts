// src/app/api/predios/[id]/financeiro/resumo/route.ts
import { NextRequest } from 'next/server'
import { isValidUUID, bad, ok, handlePrismaError } from '@/app/api/_utils'
import { z } from 'zod'
import { getResumo } from '@/server/financeiro.service'

const QuerySchema = z.object({
  competencia: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM'),
})

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID inválido')

    const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
    if (!parsed.success) return bad('Competência inválida. Use YYYY-MM')

    const data = await getResumo(predioId, parsed.data.competencia)
    return ok(data)
  } catch (err) {
    console.error('[GET /financeiro/resumo]', err)
    return handlePrismaError(err)
  }
}

