// src/app/api/predios/[id]/financeiro/recalcular/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidUUID, ok, bad, handlePrismaError } from '@/app/api/_utils'
import { startOfMonth, endOfMonth, parse } from 'date-fns'
import { z } from 'zod'
import { Prisma, PagamentoStatus } from '@prisma/client'

const QuerySchema = z.object({
  competencia: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM'),
})

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID inválido')

    const parsed = QuerySchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams)
    )
    if (!parsed.success) return bad('Competência inválida. Use YYYY-MM')

    const competenciaStr = parsed.data.competencia
    const comp = parse(competenciaStr, 'yyyy-MM', new Date())
    if (isNaN(comp.getTime())) return bad('Competência inválida. Use YYYY-MM')

    const inicio = startOfMonth(comp)
    const fim = endOfMonth(comp)
    const agora = new Date()

    // Filtro base: todos os lançamentos do prédio/competência que não estão pagos
    const whereBase: Prisma.PagamentoWhereInput = {
      predioId,
      competencia: { gte: inicio, lte: fim },
      NOT: { status: PagamentoStatus.PAGO }, // 👈 remover o "as const"
    }

    // 1) Vencidos e não pagos => ATRASADO
    const atrasados = await prisma.pagamento.updateMany({
      where: { ...whereBase, vencimento: { lt: agora } },
      data: { status: PagamentoStatus.ATRASADO },
    })

    // 2) Ainda não venceu e não pago => PENDENTE
    const pendentes = await prisma.pagamento.updateMany({
      where: { ...whereBase, vencimento: { gte: agora } },
      data: { status: PagamentoStatus.PENDENTE },
    })

    const counts = await prisma.pagamento.groupBy({
      by: ['status'],
      where: { predioId, competencia: { gte: inicio, lte: fim } },
      _count: { _all: true },
    })

    return ok({
      competencia: competenciaStr,
      updated: { atrasados: atrasados.count, pendentes: pendentes.count },
      counts,
    })
  } catch (err) {
    console.error('[POST /financeiro/recalcular]', err)
    return handlePrismaError(err)
  }
}
