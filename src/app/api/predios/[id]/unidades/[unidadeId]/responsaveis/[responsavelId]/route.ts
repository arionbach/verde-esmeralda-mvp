// src/app/api/predios/[id]/unidades/[unidadeId]/responsaveis/[responsavelId]/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, bad, notFound, conflict, noContent, handlePrismaError } from 'src/app/api/_utils'
import { z } from 'zod'
import { ResponsavelUpdateSchema } from 'src/app/api/_schemas'
import { ResponsavelTipo } from '@prisma/client'
import { toResponsavelTipoEnum } from '@/domain/unidades'

type RouteCtx = { params: Promise<{ id: string; unidadeId: string; responsavelId: string }> }

function isValidId(id: string) {
  if (!id) return false
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const cuidLike = /^[a-z0-9]{10,32}$/i
  return uuid.test(id) || cuidLike.test(id)
}

function normalizeTipo(v?: string): ResponsavelTipo | undefined {
  if (!v) return undefined
  return toResponsavelTipoEnum(v)
}

/** GET opcional: caso você queira buscar 1 responsável isolado */
export async function GET(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { unidadeId, responsavelId } = await params
    if (![unidadeId, responsavelId].every(isValidId)) return bad('ID inválido')

    const resp = await prisma.responsavel.findFirst({
      where: { id: responsavelId, unidadeId, ativo: true },
    })
    if (!resp) return notFound('Responsável não encontrado')

    return ok(resp)
  } catch (e) {
    console.error('[GET responsavel]', e)
    return handlePrismaError(e)
  }
}

/** PUT /api/predios/[id]/unidades/[unidadeId]/responsaveis/[responsavelId] */
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id: predioId, unidadeId, responsavelId } = await params
    if (![predioId, unidadeId, responsavelId].every(isValidId)) return bad('ID inválido')

    // Garante que o responsável pertence à unidade (e está ativo)
    const atual = await prisma.responsavel.findFirst({
      where: { id: responsavelId, unidadeId, ativo: true },
      select: { id: true, unidadeId: true },
    })
    if (!atual) return notFound('Responsável não encontrado nessa unidade')

    const body = await req.json()

    // Normaliza campos antes do Zod (especialmente "tipo")
    const normalized = {
      ...body,
      ...(body.tipo && { tipo: normalizeTipo(body.tipo) }),
    }

    const data = ResponsavelUpdateSchema.parse(normalized)

    // Se marcar como titular, desmarca os demais da unidade
    if (data.ehTitularCobranca === true) {
      await prisma.responsavel.updateMany({
        where: { unidadeId, id: { not: responsavelId }, ativo: true },
        data: { ehTitularCobranca: false },
      })
    }

    const atualizado = await prisma.responsavel.update({
      where: { id: responsavelId },
      data: {
        ...(data.nome !== undefined && { nome: data.nome }),
        ...(data.cpfCnpj !== undefined && { cpfCnpj: data.cpfCnpj }),
        ...(data.telefone !== undefined && { telefone: data.telefone }),
        ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.tipo !== undefined && { tipo: data.tipo }),
        ...(data.ehTitularCobranca !== undefined && { ehTitularCobranca: data.ehTitularCobranca }),
      },
    })

    return ok(atualizado)
  } catch (e) {
    if (e instanceof z.ZodError) return bad('Dados inválidos', e.flatten())
    console.error('[PUT responsavel]', e)
    return handlePrismaError(e)
  }
}

/** DELETE (soft delete) caso precise aqui também */
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { unidadeId, responsavelId } = await params
    if (![unidadeId, responsavelId].every(isValidId)) return bad('ID inválido')

    const exists = await prisma.responsavel.findFirst({
      where: { id: responsavelId, unidadeId, ativo: true },
      select: { id: true },
    })
    if (!exists) return notFound('Responsável não encontrado')

    await prisma.responsavel.update({
      where: { id: responsavelId },
      data: { ativo: false, dataFim: new Date() },
    })

    return noContent()
  } catch (e) {
    console.error('[DELETE responsavel]', e)
    return handlePrismaError(e)
  }
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  try {
    const { unidadeId, responsavelId } = await params

    const body = await req.json().catch(() => ({}))
    const tornarTitular = body?.tornarTitular === true  // opcional

    // Existe e está INATIVO?
    const atual = await prisma.responsavel.findFirst({
      where: { id: responsavelId, unidadeId, ativo: false },
      select: { id: true }
    })
    if (!atual) {
      return notFound('Responsável não encontrado ou já está ativo')
    }

    // Se vai virar titular, desmarca os demais antes
    if (tornarTitular) {
      await prisma.responsavel.updateMany({
        where: { unidadeId, ativo: true },
        data: { ehTitularCobranca: false }
      })
    }

    const reativado = await prisma.responsavel.update({
      where: { id: responsavelId },
      data: {
        ativo: true,
        dataFim: null,
        ...(tornarTitular ? { ehTitularCobranca: true } : {})
      }
    })

    return ok(reativado)
  } catch (e) {
    return handlePrismaError(e)
  }
}
