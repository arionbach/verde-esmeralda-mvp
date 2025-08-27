// src/app/api/predios/[id]/financeiro/recalcular-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    const hoje = new Date()

    // PENDENTE & vencido -> ATRASADO
    const r1 = await prisma.pagamento.updateMany({
      where: {
        status: 'PENDENTE',
        vencimento: { lt: hoje },
        unidade: { predioId }
      },
      data: { status: 'ATRASADO' }
    })
    // ATRASADO & não vencido -> PENDENTE (higienização)
    const r2 = await prisma.pagamento.updateMany({
      where: {
        status: 'ATRASADO',
        vencimento: { gte: hoje },
        unidade: { predioId }
      },
      data: { status: 'PENDENTE' }
    })

    return NextResponse.json({ ok: true, pendenteParaAtrasado: r1.count, atrasadoParaPendente: r2.count })
  } catch (e:any) {
    console.error('recalcular-status', e)
    return NextResponse.json({ ok: false, message: e.message ?? 'Erro' }, { status: 400 })
  }
}
