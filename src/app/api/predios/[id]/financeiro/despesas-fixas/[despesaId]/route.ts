// src/app/api/predios/[id]/financeiro/despesas-fixas/[despesaId]/route.ts
import { NextRequest } from 'next/server'
import { isValidUUID, ok, bad, noContent, handlePrismaError } from '@/app/api/_utils'
import { DespesaFixaUpdateSchema } from '@/app/api/_schemas'
import { updateDespesaFixa, deleteDespesaFixa } from '@/server/financeiro.service'

type Ctx = { params: Promise<{ id: string; despesaId: string }> }

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId, despesaId } = await params
    if (!isValidUUID(predioId) || !isValidUUID(despesaId)) return bad('ID inválido')
    const raw = await req.json()
    const data = DespesaFixaUpdateSchema.parse(raw)
    const updated = await updateDespesaFixa(despesaId, data)
    return ok(updated)
  } catch (err) {
    if ((err as any)?.name === 'ZodError') return bad('Dados inválidos', (err as any).flatten?.())
    return handlePrismaError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId, despesaId } = await params
    if (!isValidUUID(predioId) || !isValidUUID(despesaId)) return bad('ID inválido')
    await deleteDespesaFixa(despesaId)
    return noContent()
  } catch (err) {
    return handlePrismaError(err)
  }
}

