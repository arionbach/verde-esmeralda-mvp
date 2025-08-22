// src/app/api/predios/[id]/unidades/route.ts
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { UnidadeCreateSchema } from '../../../_schemas'
import { 
  ok, 
  created, 
  bad, 
  notFound,
  conflict,
  handlePrismaError,
  isValidUUID 
} from '../../../_utils'
import { z } from 'zod'
import { UnidadeTipo, UnidadeStatus } from '@prisma/client'

/**
 * Tipo dos parâmetros da rota (Next.js 15)
 */
type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * Normaliza tipo de unidade do frontend (minúsculo) para Prisma (maiúsculo)
 */
function normalizeTipo(tipo: string | undefined): UnidadeTipo {
  if (!tipo) return UnidadeTipo.APARTAMENTO
  
  const map: Record<string, UnidadeTipo> = {
    'apartamento': UnidadeTipo.APARTAMENTO,
    'cobertura': UnidadeTipo.COBERTURA,
    'loja': UnidadeTipo.LOJA,
    'garagem': UnidadeTipo.GARAGEM,
    'APARTAMENTO': UnidadeTipo.APARTAMENTO,
    'COBERTURA': UnidadeTipo.COBERTURA,
    'LOJA': UnidadeTipo.LOJA,
    'GARAGEM': UnidadeTipo.GARAGEM,
  }
  
  return map[tipo] || UnidadeTipo.APARTAMENTO
}

/**
 * Normaliza status da unidade
 */
function normalizeStatus(status: string | undefined): UnidadeStatus {
  if (!status) return UnidadeStatus.VAZIO
  
  const map: Record<string, UnidadeStatus> = {
    'ocupado': UnidadeStatus.OCUPADO,
    'vazio': UnidadeStatus.VAZIO,
    'OCUPADO': UnidadeStatus.OCUPADO,
    'VAZIO': UnidadeStatus.VAZIO,
  }
  
  return map[status] || UnidadeStatus.VAZIO
}

/**
 * GET /api/predios/[id]/unidades
 * Lista todas as unidades de um prédio
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: predioId } = await params
    
    // Valida formato do ID
    if (!isValidUUID(predioId)) {
      return bad('ID do prédio inválido')
    }
    
    // Verifica se o prédio existe
    const predio = await prisma.predio.findUnique({
      where: { id: predioId },
      select: { id: true, nome: true }
    })
    
    if (!predio) {
      return notFound('Prédio não encontrado')
    }
    
    // Filtros opcionais via query params
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status')
    const tipo = searchParams.get('tipo')
    
    // Busca as unidades com responsáveis ativoss
    const unidades = await prisma.unidade.findMany({
      where: {
        predioId,
        ...(status && { status: normalizeStatus(status) }),
        ...(tipo && { tipo: normalizeTipo(tipo) }),
      },
      include: {
        responsaveis: {
          where: { ativo: true },
          orderBy: { dataInicio: 'desc' },
          take: 1,
          select: {
            id: true,
            nome: true,
            cpfCnpj: true,
            telefone: true,
            email: true,
            tipo: true,
            ehTitularCobranca: true
          }
        },
        pagamentos: {
          where: {
            status: 'PENDENTE',
            dataVencimento: {
              lt: new Date() // Vencidos
            }
          },
          select: {
            id: true,
            valor: true,
            dataVencimento: true
          }
        }
      },
      orderBy: [
        { numeroInt: 'asc' },
        { numero: 'asc' }
      ]
    })
    
    // Formata a resposta com informações úteis
    const unidadesFormatadas = unidades.map(u => ({
      id: u.id,
      numero: u.numero,
      tipo: u.tipo.toLowerCase(), // Converte para minúsculo para o frontend
      status: u.status.toLowerCase(),
      metragem: u.metragem,
      fracaoIdeal: u.fracaoIdeal,
      valorTaxa: Number(u.valorTaxa),
      responsavel: u.responsaveis[0] || null,
      inadimplente: u.pagamentos.length > 0,
      valorDevido: u.pagamentos.reduce((sum, p) => sum + Number(p.valor), 0),
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }))
    
    return ok({
      predio: {
        id: predio.id,
        nome: predio.nome
      },
      unidades: unidadesFormatadas,
      total: unidadesFormatadas.length,
      resumo: {
        ocupadas: unidadesFormatadas.filter(u => u.status === 'ocupado').length,
        vazias: unidadesFormatadas.filter(u => u.status === 'vazio').length,
        inadimplentes: unidadesFormatadas.filter(u => u.inadimplente).length,
        receitaMensal: unidadesFormatadas.reduce((sum, u) => sum + u.valorTaxa, 0)
      }
    })
  } catch (error) {
    console.error('[GET /api/predios/[id]/unidades]', error)
    return handlePrismaError(error)
  }
}

/**
 * POST /api/predios/[id]/unidades
 * Cria uma nova unidade no prédio
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: predioId } = await params
    
    // Valida formato do ID
    if (!isValidUUID(predioId)) {
      return bad('ID do prédio inválido')
    }
    
    // Verifica se o prédio existe
    const predio = await prisma.predio.findUnique({
      where: { id: predioId },
      select: { 
        id: true, 
        nome: true,
        quantidadeUnidades: true,
        _count: {
          select: {
            unidades: {
              where: { ativo: true }
            }
          }
        }
      }
    })
    
    if (!predio) {
      return notFound('Prédio não encontrado')
    }
    
    // Verifica se não excedeu o limite de unidades
    if (predio._count.unidades >= predio.quantidadeUnidades) {
      return conflict(
        `O prédio "${predio.nome}" já possui ${predio._count.unidades} unidades cadastradas. ` +
        `O limite é de ${predio.quantidadeUnidades} unidades.`
      )
    }
    
    const body = await req.json()
    
    // Normaliza os tipos para maiúsculo (compatível com Prisma)
    const normalizedBody = {
      ...body,
      tipo: normalizeTipo(body.tipo),
      status: normalizeStatus(body.status)
    }
    
    // Valida os dados
    const data = UnidadeCreateSchema.parse(normalizedBody)
    
    // Verifica se já existe unidade com o mesmo número
    const existente = await prisma.unidade.findFirst({
      where: {
        predioId,
        numero: data.numero,
        ativo: true
      },
      select: { id: true }
    })
    
    if (existente) {
      return conflict(`Já existe uma unidade com o número "${data.numero}" neste prédio`)
    }
    
    // Extrai número inteiro para ordenação (ex: "101A" -> 101)
    const numeroInt = parseInt(data.numero.replace(/\D/g, '')) || 0
    
    // Cria a unidade
    const unidade = await prisma.unidade.create({
      data: {
        predioId,
        numero: data.numero,
        numeroInt,
        tipo: data.tipo,
        status: data.status,
        metragem: data.metragem,
        fracaoIdeal: data.fracaoIdeal,
        valorTaxa: data.valorTaxa || 0,
        ativo: true
      },
      include: {
        responsaveis: {
          where: { ativo: true },
          take: 1
        }
      }
    })
    
    // Formata resposta para o frontend
    const unidadeFormatada = {
      ...unidade,
      tipo: unidade.tipo.toLowerCase(),
      status: unidade.status.toLowerCase(),
      valorTaxa: Number(unidade.valorTaxa),
      responsavel: unidade.responsaveis[0] || null
    }
    
    return created(unidadeFormatada)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return bad('Dados inválidos', error.flatten())
    }
    
    console.error('[POST /api/predios/[id]/unidades]', error)
    return handlePrismaError(error)
  }
}