// src/app/api/predios/route.ts
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { PredioCreateSchema } from '../_schemas'
import { 
  ok, 
  created, 
  bad, 
  handlePrismaError,
  getPaginationParams,
  paginated 
} from '../_utils'
import { z } from 'zod'

/**
 * GET /api/predios
 * Lista todos os prédios com contagem de unidades
 * Suporta paginação: ?page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const params = getPaginationParams(searchParams)
    
    // Busca paralela para melhor performance
    const [predios, total] = await Promise.all([
      prisma.predio.findMany({
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { 
              unidades: {
                where: { ativo: true }
              }
            }
          }
        }
      }),
      prisma.predio.count()
    ])
    
    // Se não quiser paginação, retorna direto
    if (!searchParams.has('page') && !searchParams.has('limit')) {
      return ok(predios)
    }
    
    // Retorna com metadados de paginação
    return paginated(predios, total, params)
  } catch (error) {
    console.error('[GET /api/predios]', error)
    return handlePrismaError(error)
  }
}

/**
 * POST /api/predios
 * Cria um novo prédio
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Valida os dados
    const data = PredioCreateSchema.parse(body)
    
    // Cria o prédio
    const predio = await prisma.predio.create({
      data: {
        nome: data.nome,
        endereco: data.endereco,
        cnpj: data.cnpj || null,
        quantidadeUnidades: data.quantidadeUnidades || 0,
        dataFundacao: data.dataFundacao || null,
        nomeSindico: data.nomeSindico || null,
        telefoneSindico: data.telefoneSindico || null,
        emailSindico: data.emailSindico || null,
      },
      include: {
        _count: {
          select: { unidades: true }
        }
      }
    })
    
    return created(predio)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return bad('Dados inválidos', error.flatten())
    }
    
    console.error('[POST /api/predios]', error)
    return handlePrismaError(error)
  }
}