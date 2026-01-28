// src/app/api/predios/[id]/financeiro/mensalidades/gerar-por-rateio/route.ts
import { NextRequest } from 'next/server'
import { bad, ok, handlePrismaError, isValidUUID } from '@/app/api/_utils'
import { calcularRateioFixas, gerarCobrancasPorRateio, parseCompetencia } from '@/server/financeiro/financeiro.service'
import { calcularPoliticasDoMes } from '@/server/financeiro.politicas.service'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID inválido')

    const { searchParams } = new URL(req.url)
    const competencia = searchParams.get('competencia') || ''
    if (!competencia || competencia.length < 7) return bad('Competência inválida (YYYY-MM)')
    const sobrescrever = searchParams.get('sobrescrever') === '1'

    // Ordem fixa do pipeline mensal (fora de gerarCobrancasPorRateio):
    // 1) calcularRateioFixas
    await calcularRateioFixas(predioId, competencia, { sobrescrever })
    // 2) calcularPoliticasDoMes (competência normalizada startOfMonth)
    const { inicio } = parseCompetencia(competencia)
    await calcularPoliticasDoMes({ predioId, competencia: inicio })
    // 3) gerarCobrancasPorRateio
    const result = await gerarCobrancasPorRateio(predioId, competencia, { sobrescrever })
    return ok(result)
  } catch (err) {
    console.error('[mensalidades/por-rateio]', err)
    if (err instanceof Error && 'code' in err) {
      return handlePrismaError(err)
    }
    return bad('Erro ao gerar cobranças por rateio')
  }
}
