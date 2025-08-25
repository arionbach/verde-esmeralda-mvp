// src/app/api/predios/[id]/financeiro/gerar-mensal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PagamentoStatus, PagamentoTipo, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const QuerySchema = z.object({
  competencia: z.string().min(7), // 'YYYY-MM' ou 'YYYY-MM-01'
  vencimentoDia: z.string().optional() // '10'
})

function parseCompetencia(s: string) {
  const [y, m] = s.split('-')
  const year = Number(y)
  const month = Number(m)
  if (!year || !month) throw new Error('competencia inválida, use YYYY-MM')
  return new Date(Date.UTC(year, month - 1, 1))
}

function computeVencimento(competencia: Date, vencimentoDia?: number) {
  const dia = vencimentoDia && vencimentoDia >= 1 && vencimentoDia <= 28 ? vencimentoDia : 10
  return new Date(Date.UTC(competencia.getUTCFullYear(), competencia.getUTCMonth(), dia))
}

export async function POST(
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
    const vencimento = computeVencimento(
      competencia,
      parsed.data.vencimentoDia ? Number(parsed.data.vencimentoDia) : undefined
    )

    const predio = await prisma.predio.findUnique({ where: { id: predioId }, select: { id: true } })
    if (!predio) return NextResponse.json({ error: 'Prédio não encontrado' }, { status: 404 })

    const unidades = await prisma.unidade.findMany({
      where: { predioId },
      select: { id: true, valorTaxa: true }
    }) as Array<{ id: string; valorTaxa: Prisma.Decimal | number | null }>

    const registros: Array<{
      predioId: string
      unidadeId: string
      tipo: PagamentoTipo
      competencia: Date
      vencimento: Date
      valor: Prisma.Decimal | number
      status: PagamentoStatus
    }> = unidades
      .filter((u) => u.valorTaxa && Number(u.valorTaxa) > 0)
      .map((u) => ({
        predioId,
        unidadeId: u.id,
        tipo: 'TAXA_MENSAL',
        competencia,
        vencimento,
        valor: u.valorTaxa as Prisma.Decimal | number,
        status: 'PENDENTE'
      }))

    if (registros.length === 0) {
      return NextResponse.json({ created: 0, skipped: 0, message: 'Nenhuma unidade com valorTaxa > 0' })
    }

    const result = await prisma.pagamento.createMany({
      data: registros,
      skipDuplicates: true
    })

    const skipped = registros.length - result.count

    return NextResponse.json({
      created: result.count,
      skipped,
      competencia: competencia.toISOString().slice(0, 10),
      vencimento: vencimento.toISOString().slice(0, 10)
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message ?? 'Erro ao gerar mensalidade' }, { status: 500 })
  }
}
