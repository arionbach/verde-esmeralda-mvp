// src/app/api/pagamentos/[pagamentoId]/registrar-pagamento/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { Pagamento } from '@prisma/client'

const BodySchema = z.object({
  dataPagamento: z.coerce.date(),
  valorPago: z.coerce.number().min(0)
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pagamentoId: string }> }
) {
  try {
    const { pagamentoId } = await params
    const json = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const pg = await prisma.pagamento.findUnique({ where: { id: pagamentoId } })
    if (!pg) {
      return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    }

    const status: Pagamento['status'] =
      parsed.data.valorPago + 1e-6 >= Number(pg.valor) ? 'PAGO' : 'PENDENTE'

    const updated = await prisma.pagamento.update({
      where: { id: pagamentoId },
      data: {
        dataPagamento: parsed.data.dataPagamento,
        valorPago: parsed.data.valorPago,
        status
      },
      select: { id: true, status: true, dataPagamento: true, valorPago: true }
    })

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      dataPagamento: updated.dataPagamento,
      valorPago: Number(updated.valorPago ?? 0)
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message ?? 'Erro ao registrar pagamento' }, { status: 500 })
  }
}
