// src/app/api/predios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Buscar prédio específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const predio = await prisma.predio.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { unidades: true }
        }
      }
    })

    if (!predio) {
      return NextResponse.json(
        { error: 'Prédio não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(predio)
  } catch (error) {
    console.error('Erro ao buscar prédio:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar prédio' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar prédio
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { 
      nome, 
      endereco, 
      cnpj,
      quantidadeUnidades, 
      dataFundacao,
      nomeSindico,
      telefoneSindico,
      emailSindico 
    } = await request.json()

    const predio = await prisma.predio.update({
      where: { id: params.id },
      data: {
        nome,
        endereco,
        cnpj,
        quantidadeUnidades: quantidadeUnidades ? parseInt(quantidadeUnidades) : 0,
        dataFundacao: dataFundacao ? new Date(dataFundacao) : null,
        nomeSindico,
        telefoneSindico,
        emailSindico
      }
    })

    return NextResponse.json(predio)
  } catch (error) {
    console.error('Erro ao atualizar prédio:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar prédio' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar prédio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se tem unidades
    const unidadesCount = await prisma.unidade.count({
      where: { predioId: params.id }
    })

    if (unidadesCount > 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar prédio com unidades cadastradas' },
        { status: 400 }
      )
    }

    await prisma.predio.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar prédio:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar prédio' },
      { status: 500 }
    )
  }
}