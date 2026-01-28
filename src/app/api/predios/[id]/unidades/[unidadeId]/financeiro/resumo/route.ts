// src/app/api/predios/[id]/unidades/[unidadeId]/financeiro/resumo/route.ts
import { NextRequest } from 'next/server'
import { ok, bad, notFound, handlePrismaError } from '@/app/api/_utils'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getResumoFinanceiroUnidade } from '@/server/financeiro/financeiro.service'
import type { Prisma } from '@prisma/client'

const QuerySchema = z.object({
  competencia: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM'),
})

type Ctx = { params: Promise<{ id: string; unidadeId: string }> }

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId, unidadeId } = await params

    const parsed = QuerySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams))
    if (!parsed.success) return bad('Competência inválida. Use YYYY-MM')

    // Valida que a unidade pertence ao prédio
    const owns = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId, ativo: true },
      select: { id: true },
    })
    if (!owns) return notFound('Unidade não encontrada para este prédio')

    // Reutiliza o MESMO service do endpoint legacy
    const srv = await getResumoFinanceiroUnidade(unidadeId, parsed.data.competencia)

    const dec = (n: Prisma.Decimal | number) => (typeof n === 'number' ? n : Number(n))

    return ok({
      competencia: srv.competencia.toISOString().slice(0, 10),
      kpis: {
        totalDevido: dec(srv.kpis.totalDevido),
        totalRecebido: dec(srv.kpis.totalRecebido),
        inadimplentes: srv.kpis.inadimplentes,
        inadimplenciaPct: srv.kpis.inadimplenciaPct,
      },
      pendencias: srv.pendencias.map((p) => ({
        ...p,
        valor: dec(p.valor),
      })),
    })
  } catch (err) {
    console.error('[GET /api/predios/:id/unidades/:unidadeId/financeiro/resumo]', err)
    return handlePrismaError(err)
  }
}

