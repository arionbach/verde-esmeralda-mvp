import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const QuerySchema = z.object({
  competencia: z.string().min(7) // 'YYYY-MM' ou 'YYYY-MM-01'
})

function parseCompetencia(s: string) {
  const [y, m] = s.split('-')
  const year = Number(y)
  const month = Number(m)
  if (!year || !month) throw new Error('competencia inválida, use YYYY-MM')
  return new Date(Date.UTC(year, month - 1, 1))
}

function dec(n: Decimal | number | null | undefined) {
  if (!n) return 0
  return Number(n)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: predioId } = await params
    const url = new URL(req.url)
    const parsed = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const competencia = parseCompetencia(parsed.data.competencia)
    const hoje = new Date()

    const pagamentos = await prisma.pagamento.findMany({
      where: { predioId, competencia },
      select: {
        id: true, unidadeId: true, valor: true, valorPago: true, status: true, vencimento: true, tipo: true
      },
      orderBy: [{ vencimento: 'asc' }, { unidadeId: 'asc' }]
    })

    const totalDevido = pagamentos
      .filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO')
      .reduce((s, p) => s + dec(p.valor), 0)

    const totalRecebido = pagamentos
      .filter(p => p.status === 'PAGO')
      .reduce((s, p) => s + (p.valorPago ? dec(p.valorPago) : dec(p.valor)), 0)

    const qtd = pagamentos.length
    const pendentes = pagamentos.filter(p => p.status === 'PENDENTE')
    const atrasadosCalc = pagamentos.filter(p => (p.status === 'PENDENTE' && p.vencimento < hoje) || p.status === 'ATRASADO')
    const inadimplentes = new Set(atrasadosCalc.map(p => p.unidadeId)).size
    const inadimplenciaPct = qtd ? Number(((atrasadosCalc.length / qtd) * 100).toFixed(1)) : 0

    // lista simples de pendências/atrasos
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
        inadimplentes,
        inadimplenciaPct
      },
      pendencias
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message ?? 'Erro ao gerar resumo' }, { status: 500 })
  }
}
