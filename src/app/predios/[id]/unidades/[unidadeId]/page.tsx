
// src/app/api/predios/[id]/unidades/[unidadeId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET detalhes da unidade (confere se pertence ao prédio)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; unidadeId: string } }
) {
  try {
    const { id: predioId, unidadeId } = params

    const unidade = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId },
      include: {
        responsaveis: { where: { ativo: true } },
        pagamentos: true,
      },
    })

    if (!unidade) {
      return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 })
    }
    return NextResponse.json(unidade)
  } catch (e) {
    console.error('Erro ao buscar unidade:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// PUT atualizar unidade
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; unidadeId: string } }
) {
  try {
    const { id: predioId, unidadeId } = params
    const data = await req.json()

    const updated = await prisma.unidade.update({
      where: { id: unidadeId },
      data: { ...data, predioId },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('Erro ao atualizar unidade:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// DELETE remover unidade
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; unidadeId: string } }
) {
  try {
    const { unidadeId } = params
    await prisma.unidade.delete({ where: { id: unidadeId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao excluir unidade:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
