// src/app/api/predios/[id]/financeiro/despesas-fixas/route.ts
import { NextRequest } from 'next/server'
import { isValidUUID, ok, bad, created, handlePrismaError } from '@/app/api/_utils'
import { DespesaFixaCreateSchema } from '@/app/api/_schemas'
import { createDespesaFixa, listDespesasFixas } from '@/server/financeiro.service'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID inválido')
    const rows = await listDespesasFixas(predioId)
    return ok({ itens: rows, total: rows.length })
  } catch (err) {
    return handlePrismaError(err)
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID inválido')
    const raw = await req.json()
    const data = DespesaFixaCreateSchema.parse(raw)
    const createdRow = await createDespesaFixa(predioId, data)
    return created(createdRow)
  } catch (err) {
    if ((err as any)?.name === 'ZodError') return bad('Dados inválidos', (err as any).flatten?.())
    return handlePrismaError(err)
  }
}

