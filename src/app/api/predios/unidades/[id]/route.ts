import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET (uma unidade)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const u = await prisma.unidade.findUnique({
      where: { id: params.id },
      include: {
        responsaveis: { where: { ativo: true }, orderBy: { dataInicio: 'desc' } },
        predio: { select: { id: true, nome: true } },
      },
    })
    if (!u) return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 })
    return NextResponse.json(u)
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar unidade' }, { status: 500 })
  }
}

// PUT (editar unidade)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const u = await prisma.unidade.update({
      where: { id: params.id },
      data: {
        numero: body.numero,
        tipo: body.tipo,
        metragem: body.metragem != null ? Number(body.metragem) : undefined,
        fracaoIdeal: body.fracaoIdeal != null ? Number(body.fracaoIdeal) : undefined,
        valorTaxa: body.valorTaxa != null ? Number(body.valorTaxa) : undefined,
        status: body.status, // se usar enum, alinhar valores
      },
    })
    return NextResponse.json(u)
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar unidade' }, { status: 500 })
  }
}

// DELETE (excluir unidade + responsáveis)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.$transaction([
      prisma.responsavel.deleteMany({ where: { unidadeId: params.id } }),
      // se houver pagamentos/itens financeiros da unidade, deleteMany aqui
      prisma.unidade.delete({ where: { id: params.id } }),
    ])
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Não foi possível excluir a unidade' }, { status: 500 })
  }
}
