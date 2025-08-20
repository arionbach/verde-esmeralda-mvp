// src/app/api/predios/[id]/route.ts
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { PredioUpdateSchema } from '../../_schemas'
import { 
  ok, 
  notFound, 
  bad, 
  conflict,
  noContent,
  handlePrismaError,
  isValidUUID 
} from '../../_utils'
import { z } from 'zod'

/**
 * Tipo dos parâmetros da rota (Next.js 15)
 */
type RouteParams = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/predios/[id]
 * Busca um prédio específico com estatísticas
 */
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    // Valida formato do ID
    if (!isValidUUID(id)) {
      return bad('ID inválido')
    }
    
    const predio = await prisma.predio.findUnique({
      where: { id },
      include: {
        _count: {
          select: { 
            unidades: {
              where: { ativo: true }
            }
          }
        },
        // Estatísticas adicionais úteis
        unidades: {
          where: { ativo: true },
          select: {
            status: true,
            valorTaxa: true
          }
        }
      }
    })
    
    if (!predio) {
      return notFound('Prédio não encontrado')
    }
    
    // Calcula estatísticas adicionais
    const stats = {
      totalUnidades: predio.quantidadeUnidades,
      unidadesCadastradas: predio._count.unidades,
      unidadesOcupadas: predio.unidades.filter(u => u.status === 'OCUPADO').length,
      unidadesVazias: predio.unidades.filter(u => u.status === 'VAZIO').length,
      receitaPotencial: predio.unidades.reduce((sum, u) => {
        return sum + Number(u.valorTaxa || 0)
      }, 0)
    }
    
    // Remove dados desnecessários antes de enviar
    const { unidades, ...predioData } = predio
    
    return ok({
      ...predioData,
      stats
    })
  } catch (error) {
    console.error('[GET /api/predios/[id]]', error)
    return handlePrismaError(error)
  }
}

/**
 * PUT /api/predios/[id]
 * Atualiza um prédio
 */
export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    // Valida formato do ID
    if (!isValidUUID(id)) {
      return bad('ID inválido')
    }
    
    // Verifica se existe
    const exists = await prisma.predio.findUnique({
      where: { id },
      select: { id: true }
    })
    
    if (!exists) {
      return notFound('Prédio não encontrado')
    }
    
    const body = await req.json()
    
    // Valida os dados
    const data = PredioUpdateSchema.parse(body)
    
    // Atualiza o prédio
    const predio = await prisma.predio.update({
      where: { id },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.endereco !== undefined && { endereco: data.endereco }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
        ...(data.quantidadeUnidades !== undefined && { 
          quantidadeUnidades: data.quantidadeUnidades 
        }),
        ...(data.dataFundacao !== undefined && { 
          dataFundacao: data.dataFundacao 
        }),
        ...(data.nomeSindico !== undefined && { 
          nomeSindico: data.nomeSindico 
        }),
        ...(data.telefoneSindico !== undefined && { 
          telefoneSindico: data.telefoneSindico 
        }),
        ...(data.emailSindico !== undefined && { 
          emailSindico: data.emailSindico 
        }),
      },
      include: {
        _count: {
          select: { unidades: true }
        }
      }
    })
    
    return ok(predio)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return bad('Dados inválidos', error.flatten())
    }
    
    console.error('[PUT /api/predios/[id]]', error)
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/predios/[id]
 * Remove um prédio (apenas se não tiver unidades)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    
    // Valida formato do ID
    if (!isValidUUID(id)) {
      return bad('ID inválido')
    }
    
    // Verifica se existe e se tem unidades
    const predio = await prisma.predio.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
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
    
    // Não permite deletar se tiver unidades
    if (predio._count.unidades > 0) {
      return conflict(
        `Não é possível excluir o prédio "${predio.nome}" pois possui ${predio._count.unidades} unidade(s) cadastrada(s). Remova as unidades primeiro.`
      )
    }
    
    // Deleta o prédio
    await prisma.predio.delete({
      where: { id }
    })
    
    return noContent()
  } catch (error) {
    console.error('[DELETE /api/predios/[id]]', error)
    return handlePrismaError(error)
  }
}