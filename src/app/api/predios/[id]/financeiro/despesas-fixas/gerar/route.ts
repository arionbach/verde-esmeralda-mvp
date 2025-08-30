// src/app/api/predios/[id]/financeiro/despesas-fixas/gerar/route.ts
import { NextRequest } from 'next/server'
import { isValidUUID, ok, bad, handlePrismaError } from '@/app/api/_utils'
import { gerarLancamentosDespesasFixas } from '@/server/financeiro.service'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID inválido')
    const { searchParams } = new URL(req.url)
    const competencia = searchParams.get('competencia') || ''
    if (!competencia || competencia.length < 7) return bad('Competência inválida (YYYY-MM)')
    const sobrescrever = searchParams.get('sobrescrever') === '1'
    const result = await gerarLancamentosDespesasFixas(predioId, competencia, { sobrescrever })
    return ok({ competencia, ...result })
  } catch (err) {
    return handlePrismaError(err)
  }
}

