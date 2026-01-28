// src/app/api/predios/[id]/unidades/[unidadeId]/excecoes/route.ts
import { NextRequest } from 'next/server'
import { ok, bad, handlePrismaError } from '@/app/api/_utils'
import { parseCompetencia } from '@/server/financeiro/financeiro.service'
import { isCompetenciaFechada } from '@/server/financeiro/competencia-status.service'
import { upsertAjusteExcecao } from '@/server/financeiro/ajuste-excecao.service'
import { NaturezaLancamento, Prisma } from '@prisma/client'

type Ctx = { params: { id: string; unidadeId: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId, unidadeId } = params
    const body = await req.json().catch(() => ({}))

    const competenciaStr = String(body?.competencia || '')
    const naturezaStr = String(body?.natureza || '')
    const valorRaw = body?.valor
    const descricaoStr = String(body?.descricao || '').trim()

    if (!competenciaStr || competenciaStr.length < 7) {
      return bad('competencia inválida. Use YYYY-MM')
    }
    const { inicio } = parseCompetencia(competenciaStr)

    if (await isCompetenciaFechada(predioId, inicio)) {
      return bad('Competência fechada. Operação não permitida.')
    }

    if (!descricaoStr) return bad('descricao obrigatória')

    let valorDec: Prisma.Decimal
    try {
      valorDec = new Prisma.Decimal(valorRaw)
    } catch {
      return bad('valor inválido')
    }
    if (valorDec.lte(0)) return bad('valor deve ser > 0')
    if (naturezaStr !== 'CREDITO' && naturezaStr !== 'DEBITO') {
      return bad('natureza inválida (use CREDITO ou DEBITO)')
    }

    const row = await upsertAjusteExcecao({
      predioId,
      unidadeId,
      competencia: inicio,
      natureza: naturezaStr as NaturezaLancamento,
      valor: valorDec,
      descricao: descricaoStr,
    })

    return ok({
      id: row.id,
      predioId: row.predioId,
      unidadeId: row.unidadeId,
      competencia: row.competencia,
      tipoPolitica: row.tipoPolitica,
      natureza: row.natureza,
      valor: Number(row.valor),
      descricao: row.descricao,
    })
  } catch (err) {
    return handlePrismaError(err)
  }
}

