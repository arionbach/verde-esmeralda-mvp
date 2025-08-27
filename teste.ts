import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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
    const hoje = new Date()

    const pagamentos = await prisma.pagamento.findMany({
      where: { competencia, unidadeId },
      select: { id: true, unidadeId: true, valor: true, status: true, vencimento: true, tipo: true },
      orderBy: [{ vencimento: 'asc' }]
    })

    const totalDevido = pagamentos
      .filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO')
      .reduce((s, p) => s + dec(p.valor), 0)

    const totalRecebido = pagamentos
      .filter(p => p.status === 'PAGO')
      .reduce((s, p) => s + dec(p.valor), 0)

    const pendencias = pagamentos
      .filter(p => p.status !== 'PAGO')
      .map(p => ({
        id: p.id,
        unidadeId: p.unidadeId,
        valor: dec(p.valor),
        status: p.status,
        diasAtraso: p.vencimento < hoje ? Math.floor((+hoje - +p.vencimento) / 86400000) : 0
      }))

    return NextResponse.json({
      competencia: competencia.toISOString().slice(0, 10),
      kpis: {
        totalDevido,
        totalRecebido,
        inadimplentes: pendencias.length ? 1 : 0,
        inadimplenciaPct: pendencias.length ? 100 : 0
      },
      pendencias
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message ?? 'Erro ao gerar resumo' }, { status: 500 })
  }
}
