// src/app/api/pagamentos/[id]/pagar/route.ts
import { NextRequest } from 'next/server'
import { pagarPagamento } from '@/server/financeiro/financeiro.service'
import { ok, bad, handlePrismaError, isValidUUID } from '@/app/api/_utils'

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    if (!isValidUUID(id)) return bad('ID inválido')

    const pago = await pagarPagamento(id)
    return ok({ ...pago, valor: Number(pago.valor) })
  } catch (err) {
    console.error('[PATCH /pagamentos/:id/pagar]', err)
    return handlePrismaError(err)
  }
}

