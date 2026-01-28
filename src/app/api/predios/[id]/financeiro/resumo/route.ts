// src/app/api/predios/[id]/financeiro/resumo/route.ts
// @deprecated Rota de resumo V2 mantida por compatibilidade durante a Fase 1.
// KPIs oficiais usam Pagamento via getResumoV3, expostos temporariamente em /resumo-v3.
import { NextRequest } from 'next/server'
import { getResumoV2 } from '@/server/financeiro/financeiro.service'
import { handlePrismaError } from '@/app/api/_utils'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const url = new URL(req.url)
    const competencia = url.searchParams.get('competencia') ?? ''
    const data = await getResumoV2(id, competencia)
    return Response.json(data)
  } catch (e) {
    console.error('GET /financeiro/resumo', e)
    return handlePrismaError(e)
  }
}
