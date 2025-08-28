// src/app/api/pagamentos/[pagamentoId]/pagar/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, bad, handlePrismaError, isValidUUID } from '@/app/api/_utils'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!isValidUUID(id)) return bad('ID inválido')

    const now = new Date()
    const pago = await prisma.pagamento.update({
      where: { id },
      data: { status: 'PAGO', dataPagamento: now },
      select: {
        id: true, status: true, dataPagamento: true, valor: true,
        unidadeId: true, competencia: true
      }
    })

    return ok({
      ...pago,
      valor: Number(pago.valor)
    })
  } catch (err) {
    console.error('[PATCH /pagamentos/:id/pagar]', err)
    return handlePrismaError(err)
  }
}
