// src/app/api/predios/%5Bid%5D/financeiro/pagamentos/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, bad, handlePrismaError, isValidUUID } from '@/app/api/_utils'
import { startOfMonth, endOfMonth, parse } from 'date-fns'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID inválido')

    const { searchParams } = new URL(req.url)
    const competenciaStr = searchParams.get('competencia')
    const status = (searchParams.get('status') || 'PENDENCIAS').toUpperCase()

    if (!competenciaStr) return bad('competencia (YYYY-MM) obrigatória')

    const comp = parse(competenciaStr, 'yyyy-MM', new Date())
    const inicio = startOfMonth(comp)
    const fim = endOfMonth(comp)

    let statusFilter:
      | { in: ('PENDENTE' | 'ATRASADO')[] }
      | { equals: 'PENDENTE' | 'ATRASADO' | 'PAGO' }
      | undefined

    if (status === 'PENDENCIAS') statusFilter = { in: ['PENDENTE', 'ATRASADO'] }
    else if (status !== 'TODOS') statusFilter = { equals: status as any }

    const rows = await prisma.pagamento.findMany({
      where: {
        predioId,
        competencia: { gte: inicio, lte: fim },
        ...(statusFilter ? { status: statusFilter as any } : {})
      },
      orderBy: [{ vencimento: 'asc' }, { createdAt: 'asc' }],
      include: {
        unidade: { select: { numero: true } }
      }
    })

const hoje = new Date()
const itens = rows.map(r => {
  const vencido = r.status !== 'PAGO' && r.vencimento < hoje
  const statusUI = r.status === 'PAGO' ? 'PAGO' : (vencido ? 'ATRASADO' : 'PENDENTE')
  return {
    id: r.id,
    unidadeId: r.unidadeId,
    unidadeNome: r.unidade?.numero ? `Unidade ${r.unidade.numero}` : undefined,
    valor: Number(r.valor),
    status: statusUI,
    diasAtraso: vencido
      ? Math.max(0, Math.floor((+hoje - +r.vencimento) / 86_400_000))
      : 0,
  }
})

return ok({ itens })
  } catch (err) {
    console.error('[GET /financeiro/pagamentos]', err)
    return handlePrismaError(err)
  }
}
