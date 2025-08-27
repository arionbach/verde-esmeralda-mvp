// src/app/api/pagamentos/[pagamentoId]/pagar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const BodySchema = z.object({
  // MVP: ignoramos valorPago (sem parcial)
  dataPagamento: z.string().optional() // 'YYYY-MM-DD'
})

type Ctx = { params: Promise<{ pagamentoId: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { pagamentoId } = await params
    const body = BodySchema.parse(await req.json().catch(() => ({})))

    const current = await prisma.pagamento.findUnique({
      where: { id: pagamentoId },
      select: { id: true, status: true, valor: true }
    })
    if (!current) return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 })
    if (current.status === 'PAGO') {
      return NextResponse.json({ ok: true, message: 'Já estava pago' })
    }

    const dataPagamento = body.dataPagamento
      ? new Date(body.dataPagamento + 'T00:00:00Z')
      : new Date()

    await prisma.pagamento.update({
      where: { id: pagamentoId },
      data: {
        status: 'PAGO',
        dataPagamento
      }
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('pagar', e)
    return NextResponse.json({ ok: false, message: e.message ?? 'Erro ao registrar pagamento' }, { status: 400 })
  }
}
