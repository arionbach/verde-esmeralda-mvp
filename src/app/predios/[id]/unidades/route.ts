import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { PagamentoStatus } from '@prisma/client'

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id: predioId } = await ctx.params

    const unidades = await prisma.unidade.findMany({
      where: { predioId, ativo: true },
      include: {
        responsaveis: {
          where: { ativo: true },
          orderBy: { dataInicio: 'desc' },
          select: {
            id: true,
            nome: true,
            tipo: true,
            telefone: true,
            email: true,
          },
          take: 1,
        },
        pagamentos: {
          where: { status: PagamentoStatus.PENDENTE },
          select: { id: true },
        },
      },
      orderBy: [{ numeroInt: 'asc' }, { numero: 'asc' }],
    })

    const data = unidades.map((u) => ({
      id: u.id,
      numero: u.numero,
      numeroInt: u.numeroInt,
      status: u.status,
      tipo: u.tipo,
      metragem: u.metragem,
      fracaoIdeal: u.fracaoIdeal,
      valorTaxa: u.valorTaxa != null ? Number(u.valorTaxa) : null,
      responsavel: u.responsaveis[0] ?? null,
      temPagamentoPendente: u.pagamentos.length > 0,
    }))

    return NextResponse.json(data, { status: 200 })
  } catch (e) {
    console.error('[GET /api/predios/[id]/unidades] erro:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
