import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const predios = await prisma.predio.findMany({
      include: {
        _count: {
          select: {
            unidades: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(predios)
  } catch (error) {
    console.error('Erro ao buscar prédios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const predio = await prisma.predio.create({
      data: {
        nome: body.nome,
        endereco: body.endereco,
        cnpj: body.cnpj || null,
        quantidadeUnidades: parseInt(body.quantidadeUnidades),
        dataFundacao: body.dataFundacao ? new Date(body.dataFundacao) : null,
        nomeSindico: body.nomeSindico || null,
        telefoneSindico: body.telefoneSindico || null,
        emailSindico: body.emailSindico || null,
      }
    })
    
    return NextResponse.json(predio, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar prédio:', error)
    return NextResponse.json(
      { error: 'Erro ao criar prédio' },
      { status: 500 }
    )
  }
}
