// src/app/api/predios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Listar todos os prédios
export async function GET() {
  try {
    const predios = await prisma.predio.findMany({
      include: {
        _count: {
          select: { unidades: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(predios)
  } catch (error) {
    console.error('Erro ao buscar prédios:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar prédios' },
      { status: 500 }
    )
  }
}

// POST - Criar novo prédio
export async function POST(request: NextRequest) {
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

    const predio = await prisma.predio.create({
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
    console.error('Erro ao criar prédio:', error)
    return NextResponse.json(
      { error: 'Erro ao criar prédio' },
      { status: 500 }
    )
  }
}