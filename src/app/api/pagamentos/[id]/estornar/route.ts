// src/app/api/pagamentos/[id]/estornar/route.ts
import { NextRequest } from 'next/server'
import { estornarPagamento } from '@/server/financeiro/financeiro.service'
import { ok, bad, handlePrismaError, isValidUUID } from '@/app/api/_utils'

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    if (!isValidUUID(id)) return bad('ID inválido')

    const up = await estornarPagamento(id)
    return ok(up)
  } catch (err) {
    console.error('[PATCH estornar]', err)
    if ((err as any)?.message === 'Pagamento não encontrado') return bad('Pagamento não encontrado')
    return handlePrismaError(err)
  }
}
