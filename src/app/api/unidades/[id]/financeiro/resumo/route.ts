import { NextRequest, NextResponse } from 'next/server'
import { getResumoFinanceiroUnidade } from '@/server/financeiro/financeiro.service'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

const QuerySchema = z.object({ competencia: z.string().min(7) }) // YYYY-MM

function parseCompetencia(s: string) {
  const [y, m] = s.split('-'); const Y = +y; const M = +m
  if (!Y || !M) throw new Error('competencia inválida, use YYYY-MM')
  return new Date(Date.UTC(Y, M - 1, 1))
}
const dec = (n: Prisma.Decimal | number) => (typeof n === 'number' ? n : Number(n))

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: unidadeId } = await params
    const url = new URL(req.url)
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const competencia = parseCompetencia(parsed.data.competencia)
  const srv = await getResumoFinanceiroUnidade(unidadeId, parsed.data.competencia)

  return NextResponse.json({
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
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message ?? 'Erro ao gerar resumo' }, { status: 500 })
  }
}
