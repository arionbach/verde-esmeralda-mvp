// src/app/api/predios/[id]/unidades/[unidadeId]/route.ts
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { UnidadeUpdateSchema } from '../../../../_schemas'
import { 
  ok, 
  notFound, 
  bad,
  conflict,
  noContent,
  handlePrismaError,
  isValidUUID 
} from '../../../../_utils'
import { z } from 'zod'
import { UnidadeTipo, UnidadeStatus } from '@prisma/client'

/**
 * Tipo dos parâmetros da rota (Next.js 15)
 */
type RouteParams = {
  params: Promise<{ 
    id: string
    unidadeId: string 
  }>
}

/**
 * Normaliza tipo de unidade
 */
function normalizeTipo(tipo: string | undefined): UnidadeTipo | undefined {
  if (!tipo) return undefined
  
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
  
  return map[tipo]
}

/**
 * Normaliza status da unidade
 */
function normalizeStatus(status: string | undefined): UnidadeStatus | undefined {
  if (!status) return undefined
  
  const map: Record<string, UnidadeStatus> = {
    'ocupado': UnidadeStatus.OCUPADO,
    'vazio': UnidadeStatus.VAZIO,
    'OCUPADO': UnidadeStatus.OCUPADO,
    'VAZIO': UnidadeStatus.VAZIO,
  }
  
  return map[status]
}

/**
 * GET /api/predios/[id]/unidades/[unidadeId]
 * Busca detalhes completos de uma unidade
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: predioId, unidadeId } = await params
    
    // Valida formatos dos IDs
    if (!isValidUUID(predioId) || !isValidUUID(unidadeId)) {
      return bad('ID inválido')
    }
    
    const unidade = await prisma.unidade.findFirst({
      where: {
        id: unidadeId,
        predioId,
        ativo: true
      },
      include: {
        predio: {
          select: {
            id: true,
            nome: true,
            endereco: true
          }
        },
        responsaveis: {
          where: { ativo: true },
          orderBy: { dataInicio: 'desc' },
          select: {
            id: true,
            nome: true,
            cpfCnpj: true,
            telefone: true,
            whatsapp: true,
            email: true,
            tipo: true,
            ehTitularCobranca: true,
            dataInicio: true
          }
        },
        pagamentos: {
          orderBy: { dataVencimento: 'desc' },
          take: 12, // Últimos 12 meses
          select: {
            id: true,
            tipo: true,
            valor: true,
            competencia: true,
            dataVencimento: true,
            dataPagamento: true,
            status: true
          }
        }
      }
    })
    
    if (!unidade) {
      return notFound('Unidade não encontrada')
    }
    
    // Calcula estatísticas financeiras
    const pagamentosPendentes = unidade.pagamentos.filter(p => p.status === 'PENDENTE')
    const pagamentosVencidos = pagamentosPendentes.filter(p => 
      p.dataVencimento < new Date()
    )
    
    // Formata resposta
    const unidadeFormatada = {
      id: unidade.id,
      numero: unidade.numero,
      tipo: unidade.tipo.toLowerCase(),
      status: unidade.status.toLowerCase(),
      metragem: unidade.metragem,
      fracaoIdeal: unidade.fracaoIdeal,
      valorTaxa: Number(unidade.valorTaxa),
      predio: unidade.predio,
      responsaveis: unidade.responsaveis,
      financeiro: {
        pagamentosPendentes: pagamentosPendentes.length,
        pagamentosVencidos: pagamentosVencidos.length,
        valorDevido: pagamentosVencidos.reduce((sum, p) => sum + Number(p.valor), 0),
        historicoPagamentos: unidade.pagamentos.map(p => ({
          ...p,
          valor: Number(p.valor)
        }))
      },
      createdAt: unidade.createdAt,
      updatedAt: unidade.updatedAt
    }
    
    return ok(unidadeFormatada)
  } catch (error) {
    console.error('[GET /api/predios/[id]/unidades/[unidadeId]]', error)
    return handlePrismaError(error)
  }
}

/**
 * PUT /api/predios/[id]/unidades/[unidadeId]
 * Atualiza uma unidade
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: predioId, unidadeId } = await params
    
    // Valida formatos dos IDs
    if (!isValidUUID(predioId) || !isValidUUID(unidadeId)) {
      return bad('ID inválido')
    }
    
    // Verifica se a unidade existe e pertence ao prédio
    const unidadeAtual = await prisma.unidade.findFirst({
      where: {
        id: unidadeId,
        predioId,
        ativo: true
      },
      select: { 
        id: true, 
        numero: true 
      }
    })
    
    if (!unidadeAtual) {
      return notFound('Unidade não encontrada')
    }
    
    const body = await req.json()
    
    // Normaliza os tipos se fornecidos
    const normalizedBody = {
      ...body,
      ...(body.tipo && { tipo: normalizeTipo(body.tipo) }),
      ...(body.status && { status: normalizeStatus(body.status) })
    }
    
    // Valida os dados
    const data = UnidadeUpdateSchema.parse(normalizedBody)
    
    // Se está mudando o número, verifica duplicação
    if (data.numero && data.numero !== unidadeAtual.numero) {
      const duplicada = await prisma.unidade.findFirst({
        where: {
          predioId,
          numero: data.numero,
          ativo: true,
          NOT: { id: unidadeId }
        },
        select: { id: true }
      })
      
      if (duplicada) {
        return conflict(`Já existe uma unidade com o número "${data.numero}" neste prédio`)
      }
    }
    
    // Extrai número inteiro para ordenação se o número mudou
    const numeroInt = data.numero 
      ? parseInt(data.numero.replace(/\D/g, '')) || 0
      : undefined
    
    // Atualiza a unidade
    const unidade = await prisma.unidade.update({
      where: { id: unidadeId },
      data: {
        ...(data.numero !== undefined && { 
          numero: data.numero,
          numeroInt 
        }),
        ...(data.tipo !== undefined && { tipo: data.tipo }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.metragem !== undefined && { metragem: data.metragem }),
        ...(data.fracaoIdeal !== undefined && { fracaoIdeal: data.fracaoIdeal }),
        ...(data.valorTaxa !== undefined && { valorTaxa: data.valorTaxa })
      },
      include: {
        responsaveis: {
          where: { ativo: true },
          take: 1
        }
      }
    })
    
    // Formata resposta
    const unidadeFormatada = {
      ...unidade,
      tipo: unidade.tipo.toLowerCase(),
      status: unidade.status.toLowerCase(),
      valorTaxa: Number(unidade.valorTaxa),
      responsavel: unidade.responsaveis[0] || null
    }
    
    return ok(unidadeFormatada)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return bad('Dados inválidos', error.flatten())
    }
    
    console.error('[PUT /api/predios/[id]/unidades/[unidadeId]]', error)
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/predios/[id]/unidades/[unidadeId]
 * Remove uma unidade (soft delete)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: predioId, unidadeId } = await params
    
    // Valida formatos dos IDs
    if (!isValidUUID(predioId) || !isValidUUID(unidadeId)) {
      return bad('ID inválido')
    }
    
    // Verifica se existe
    const unidade = await prisma.unidade.findFirst({
      where: {
        id: unidadeId,
        predioId,
        ativo: true
      },
      select: {
        id: true,
        numero: true,
        _count: {
          select: {
            responsaveis: {
              where: { ativo: true }
            },
            pagamentos: {
              where: { status: 'PENDENTE' }
            }
          }
        }
      }
    })
    
    if (!unidade) {
      return notFound('Unidade não encontrada')
    }
    
    // Avisa se tem pendências
    if (unidade._count.pagamentos > 0) {
      return conflict(
        `A unidade ${unidade.numero} possui ${unidade._count.pagamentos} pagamento(s) pendente(s). ` +
        `Resolva as pendências antes de excluir.`
      )
    }
    
    // Soft delete - mantém histórico
    await prisma.unidade.update({
      where: { id: unidadeId },
      data: {
        ativo: false,
        deletedAt: new Date()
      }
    })
    
    // Desativa responsáveis também
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
    
    return noContent()
  } catch (error) {
    console.error('[DELETE /api/predios/[id]/unidades/[unidadeId]]', error)
    return handlePrismaError(error)
  }
}