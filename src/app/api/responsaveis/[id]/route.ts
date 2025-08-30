// src/app/api/responsaveis/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT - Atualizar responsável
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { nome, tipo, cpfCnpj, telefone, whatsapp, email, ativo } = await request.json()

    const responsavel = await prisma.responsavel.update({
      where: { id: params.id },
      data: {
        nome,
        tipo,
        cpfCnpj,
        telefone,
        whatsapp,
        email,
        ativo: ativo !== undefined ? ativo : true
      }
    })

    return NextResponse.json(responsavel)
  } catch (error) {
    console.error('Erro ao atualizar responsável:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar responsável' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar responsável
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.responsavel.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar responsável:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar responsável' },
      { status: 500 }
    )
  }
}
