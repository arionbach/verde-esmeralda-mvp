// DEPRECATED: usar /api/predios/:predioId/unidades/:unidadeId/responsaveis
// src/app/api/unidades/[id]/responsaveis/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import {
  ok, created, bad, notFound, conflict, noContent, handlePrismaError, isValidUUID
} from '@/app/api/_utils'
import { ResponsavelTipo } from '@prisma/client'

type RouteParams = {
  params: Promise<{ id: string }>
}

// Schema de criação
const CreateResponsavelSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ obrigatório'),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  tipo: z.nativeEnum(ResponsavelTipo).default('PROPRIETARIO'),
  ehTitularCobranca: z.boolean().default(false)
})

/**
 * GET /api/unidades/[id]/responsaveis
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id: unidadeId } = await params
    console.warn("[DEPRECATED] /api/unidades/:id/responsaveis called", {
      unidadeId,
      method: "GET",
      referer: _req.headers.get("referer") ?? undefined,
    })
    if (!isValidUUID(unidadeId)) return bad('ID inválido')

    const unidade = await prisma.unidade.findUnique({
      where: { id: unidadeId },
      select: { id: true }
    })
    if (!unidade) return notFound('Unidade não encontrada')

    const responsaveis = await prisma.responsavel.findMany({
      where: {
        unidadeId,
        ativo: true
      },
      orderBy: { dataInicio: 'desc' }
    })

    return ok(responsaveis)
  } catch (e) {
    return handlePrismaError(e)
  }
}

/**
 * POST /api/unidades/[id]/responsaveis
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: unidadeId } = await params
    console.warn("[DEPRECATED] /api/unidades/:id/responsaveis called", {
      unidadeId,
      method: "POST",
      referer: req.headers.get("referer") ?? undefined,
    })
    if (!isValidUUID(unidadeId)) return bad('ID inválido')

    const unidade = await prisma.unidade.findUnique({
      where: { id: unidadeId },
      select: { id: true }
    })
    if (!unidade) return notFound('Unidade não encontrada')

    const json = await req.json()
    const data = CreateResponsavelSchema.parse(json)

    // Validação: apenas 1 titular por unidade
    if (data.ehTitularCobranca) {
      const titular = await prisma.responsavel.findFirst({
        where: {
          unidadeId,
          ehTitularCobranca: true,
          ativo: true
        },
        select: { id: true }
      })

      if (titular) {
        return conflict('Já existe um titular de cobrança ativo para esta unidade.')
      }
    }

    const novo = await prisma.responsavel.create({
      data: {
        ...data,
        unidadeId
      }
    })

    return created(novo)
  } catch (e) {
    if (e instanceof z.ZodError) return bad('Dados inválidos', e.flatten())
    return handlePrismaError(e)
  }
}


