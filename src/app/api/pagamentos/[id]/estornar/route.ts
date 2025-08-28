// src/app/api/pagamentos/[id]/estornar/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, bad, handlePrismaError, isValidUUID } from '@/app/api/_utils'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    if (!isValidUUID(id)) return bad('ID inválido')

    const p = await prisma.pagamento.findUnique({
      where: { id },
      select: { id: true, status: true, vencimento: true },
    })
    if (!p) return bad('Pagamento não encontrado')

    const hoje = new Date()
    const novoStatus = new Date(p.vencimento) < hoje ? 'ATRASADO' : 'PENDENTE'

    const up = await prisma.pagamento.update({
      where: { id },
      data: { status: novoStatus, dataPagamento: null },
      select: { id: true, status: true, dataPagamento: true },
    })

    return ok(up)
  } catch (err) {
    console.error('[PATCH estornar]', err)
    return handlePrismaError(err)
  }
}
