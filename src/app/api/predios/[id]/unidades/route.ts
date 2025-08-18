// src/app/api/predios/[id]/unidades/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação
const UnidadeSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  tipo: z.enum(['apartamento', 'cobertura', 'loja', 'garagem']).default('apartamento'),
  metragem: z.number().optional(),
  fracaoIdeal: z.number().optional(),
  status: z.enum(['ocupado', 'vazio']).default('ocupado'),
  valorTaxa: z.number().min(0).default(0),
})

// GET - Listar unidades do prédio
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const predioId = params.id

    // Verificar se prédio existe
    const predio = await prisma.predio.findUnique({
      where: { id: predioId }
    })

    if (!predio) {
      return NextResponse.json(
        { error: 'Prédio não encontrado' },
        { status: 404 }
      )
    }

    const unidades = await prisma.unidade.findMany({
      where: { predioId },
      include: {
        responsaveis: {
          where: { ativo: true },
          select: {
            id: true,
            nome: true,
            tipo: true,
            telefone: true,
            email: true,
          }
        },
        _count: {
          select: {
            pagamentos: {
              where: { status: 'pendente' }
            }
          }
        }
      },
      orderBy: [
        { numero: 'asc' }
      ]
    })
    
    return NextResponse.json(unidades)
  } catch (error) {
    console.error('Erro ao buscar unidades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova unidade
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const predioId = params.id
    const body = await request.json()
    
    // Validar dados
    const validatedData = UnidadeSchema.parse(body)
    
    // Verificar se prédio existe
    const predio = await prisma.predio.findUnique({
      where: { id: predioId }
    })

    if (!predio) {
      return NextResponse.json(
        { error: 'Prédio não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se número já existe no prédio
    const unidadeExistente = await prisma.unidade.findUnique({
      where: {
        predioId_numero: {
          predioId,
          numero: validatedData.numero
        }
      }
    })

    if (unidadeExistente) {
      return NextResponse.json(
        { error: 'Já existe uma unidade com este número neste prédio' },
        { status: 409 }
      )
    }
    
    const unidade = await prisma.unidade.create({
      data: {
        ...validatedData,
        predioId,
      },
      include: {
        responsaveis: {
          where: { ativo: true }
        }
      }
    })
    
    return NextResponse.json(unidade, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao criar unidade:', error)
    return NextResponse.json(
      { error: 'Erro ao criar unidade' },
      { status: 500 }
    )
  }
}