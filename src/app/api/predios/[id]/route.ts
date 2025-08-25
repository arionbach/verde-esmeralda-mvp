// src/app/api/predios/[id]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PredioUpdateSchema } from '../../_schemas'
import { 
  ok, 
  notFound, 
  bad, 
  conflict,
  noContent,
  handlePrismaError,
} from '../../_utils'
import { z } from 'zod'

type RouteCtx = { params: { id: string } }

/** Aceita cuid() e UUID; ajuste se quiser mais rígido */
function isValidId(id: string) {
  if (!id || typeof id !== 'string') return false
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const cuidLike = /^[a-z0-9]{10,32}$/i
  return uuid.test(id) || cuidLike.test(id)
}

/**
 * GET /api/predios/[id]
 * Busca um prédio específico com estatísticas
 */
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = params

    if (!isValidId(id)) {
      return bad('ID inválido')
    }

    const predio = await prisma.predio.findUnique({
      where: { id },
      include: {
        _count: {
          // ⚠️ sem where aqui
          select: { unidades: true },
        },
        // Aqui pode filtrar normalmente
        unidades: {
          where: { ativo: true }, // remova se seu schema não tiver "ativo"
          select: {
            status: true,
            valorTaxa: true,
          },
        },
      },
    })

    if (!predio) {
      return notFound('Prédio não encontrado')
    }

    const stats = {
      totalUnidades: predio.quantidadeUnidades,
      unidadesCadastradas: predio._count.unidades,
      unidadesOcupadas: predio.unidades.filter(u => u.status === 'OCUPADO').length,
      unidadesVazias: predio.unidades.filter(u => u.status === 'VAZIO').length,
      receitaPotencial: predio.unidades.reduce((sum, u) => {
        return sum + Number(u.valorTaxa ?? 0)
      }, 0),
    }

    const { unidades, ...predioData } = predio
    return ok({ ...predioData, stats })
  } catch (error) {
    console.error('[GET /api/predios/[id]]', error)
    return handlePrismaError(error)
  }
}

/**
 * PUT /api/predios/[id]
 * Atualiza um prédio
 */
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = params
    if (!isValidId(id)) return bad('ID inválido')

    const exists = await prisma.predio.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!exists) return notFound('Prédio não encontrado')

    const body = await req.json()
    const data = PredioUpdateSchema.parse(body)

    const predio = await prisma.predio.update({
      where: { id },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.endereco !== undefined && { endereco: data.endereco }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
        ...(data.quantidadeUnidades !== undefined && {
          quantidadeUnidades: data.quantidadeUnidades,
        }),
        ...(data.dataFundacao !== undefined && { dataFundacao: data.dataFundacao }),
        ...(data.nomeSindico !== undefined && { nomeSindico: data.nomeSindico }),
        ...(data.telefoneSindico !== undefined && {
          telefoneSindico: data.telefoneSindico,
        }),
        ...(data.emailSindico !== undefined && { emailSindico: data.emailSindico }),
      },
      include: {
        _count: { select: { unidades: true } },
      },
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
 * Remove um prédio (apenas se não tiver unidades ativas)
 */
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id } = params
    if (!isValidId(id)) return bad('ID inválido')

    const predio = await prisma.predio.findUnique({
      where: { id },
      select: { id: true, nome: true },
    })
    if (!predio) return notFound('Prédio não encontrado')

    // Conte as unidades ativas separadamente (sem where dentro do _count)
    const unidadesAtivas = await prisma.unidade.count({
      where: { predioId: id, ativo: true }, // remova "ativo" se não existir
    })

    if (unidadesAtivas > 0) {
      return conflict(
        `Não é possível excluir o prédio "${predio.nome}" pois possui ${unidadesAtivas} unidade(s) cadastrada(s). Remova as unidades primeiro.`
      )
    }

    await prisma.predio.delete({ where: { id } })
    return noContent()
  } catch (error) {
    console.error('[DELETE /api/predios/[id]]', error)
    return handlePrismaError(error)
  }
}
