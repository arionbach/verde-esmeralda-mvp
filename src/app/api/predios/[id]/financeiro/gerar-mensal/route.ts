import { NextRequest, NextResponse } from 'next/server'
import { PagamentoTipo, PagamentoStatus } from '@prisma/client'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const QuerySchema = z.object({
  competencia: z.string().min(7), // 'YYYY-MM' ou 'YYYY-MM-01'
  vencimentoDia: z.string().optional() // '10' (dia do mês). Opcional
})

function parseCompetencia(s: string) {
  // aceita 'YYYY-MM' ou 'YYYY-MM-01'
  const [y, m] = s.split('-')
  const year = Number(y)
  const month = Number(m) // 1..12
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
    const vencimento = computeVencimento(competencia, parsed.data.vencimentoDia ? Number(parsed.data.vencimentoDia) : undefined)

    // valida prédio
    const predio = await prisma.predio.findUnique({ where: { id: predioId }, select: { id: true } })
    if (!predio) return NextResponse.json({ error: 'Prédio não encontrado' }, { status: 404 })

    // busca unidades do prédio
    const unidades = await prisma.unidade.findMany({
      where: { predioId },
      select: { id: true, valorTaxa: true }
    })

    // prepara payloads
    const registros = unidades
      .filter(u => u.valorTaxa && Number(u.valorTaxa) > 0)
      .map(u => ({
        predioId,
        unidadeId: u.id,
        tipo: 'TAXA_MENSAL' as const,
        competencia,
        vencimento,
        valor: u.valorTaxa,
        status: 'PENDENTE' as const
      }))

    if (registros.length === 0) {
      return NextResponse.json({ created: 0, skipped: 0, message: 'Nenhuma unidade com valorTaxa > 0' })
    }

    // idempotente via unique([unidadeId, competencia, tipo]) + skipDuplicates
    const result = await prisma.pagamento.createMany({
      data: registros,
      skipDuplicates: true
    })

    // contagem do que já existia
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
