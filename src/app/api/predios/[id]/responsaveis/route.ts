// src/app/api/unidades/[id]/responsaveis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação
const ResponsavelSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ é obrigatório'),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  tipo: z.enum(['proprietario', 'inquilino']).default('proprietario'),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
})

// GET - Listar responsáveis da unidade
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unidadeId = params.id

    // Verificar se unidade existe
    const unidade = await prisma.unidade.findUnique({
      where: { id: unidadeId },
      include: { predio: { select: { nome: true } } }
    })

    if (!unidade) {
      return NextResponse.json(
        { error: 'Unidade não encontrada' },
        { status: 404 }
      )
    }

    const responsaveis = await prisma.responsavel.findMany({
      where: { unidadeId },
      orderBy: [
        { ativo: 'desc' },
        { dataInicio: 'desc' }
      ]
    })
    
    return NextResponse.json({
      unidade: {
        id: unidade.id,
        numero: unidade.numero,
        predio: unidade.predio.nome
      },
      responsaveis
    })
  } catch (error) {
    console.error('Erro ao buscar responsáveis:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo responsável
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unidadeId = params.id
    const body = await request.json()
    
    // Validar dados
    const validatedData = ResponsavelSchema.parse(body)
    
    // Verificar se unidade existe
    const unidade = await prisma.unidade.findUnique({
      where: { id: unidadeId }
    })

    if (!unidade) {
      return NextResponse.json(
        { error: 'Unidade não encontrada' },
        { status: 404 }
      )
    }

    // Se está cadastrando um novo responsável ativo, desativar outros ativos
    if (body.ativo !== false) {
      await prisma.responsavel.updateMany({
        where: {
          unidadeId,
          ativo: true
        },
        data: {
          ativo: false,
          dataFim: new Date()
        }
      })
    }
    
    const responsavel = await prisma.responsavel.create({
      data: {
        ...validatedData,
        unidadeId,
        email: validatedData.email || null,
        dataInicio: validatedData.dataInicio ? new Date(validatedData.dataInicio) : new Date(),
        dataFim: validatedData.dataFim ? new Date(validatedData.dataFim) : null,
        ativo: body.ativo !== false, // Por padrão é ativo
      }
    })
    
    return NextResponse.json(responsavel, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao criar responsável:', error)
    return NextResponse.json(
      { error: 'Erro ao criar responsável' },
      { status: 500 }
    )
  }
}