// src/app/api/predios/[id]/unidades/[unidadeId]/responsaveis/route.ts
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import {
  ok,
  created,
  bad,
  notFound,
  conflict,
  handlePrismaError,
  isValidUUID
} from '@/app/api/_utils'
import { ResponsavelTipo } from '@prisma/client'

// Schema de validação com zod
const ResponsavelCreateSchema = z.object({
  nome: z.string().min(2),
  cpfCnpj: z.string().min(11),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  tipo: z.nativeEnum(ResponsavelTipo).default('PROPRIETARIO'),
  ehTitularCobranca: z.boolean().default(false),
  dataInicio: z.coerce.date().default(new Date())
})

type RouteParams = {
  params: Promise<{ id: string; unidadeId: string }>
}

export async function GET(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: predioId, unidadeId } = await params

    // 🛡️ Validação básica
    if (!isValidUUID(predioId) || !isValidUUID(unidadeId)) {
      return bad('IDs inválidos')
    }

    // 🏢 Verifica se a unidade existe e pertence ao prédio
    const unidade = await prisma.unidade.findFirst({
      where: {
        id: unidadeId,
        predioId,
        ativo: true
      },
      select: { id: true }
    })

    if (!unidade) {
      return notFound('Unidade não encontrada ou inativa')
    }

    // 👥 Busca responsáveis ativos
    const responsaveis = await prisma.responsavel.findMany({
      where: {
        unidadeId,
        ativo: true
      },
      orderBy: { dataInicio: 'desc' }
    })

    return ok({
      unidadeId,
      responsaveis,
      total: responsaveis.length
    })
  } catch (error) {
    console.error('[GET /responsaveis]', error)
    return handlePrismaError(error)
  }
}

export async function POST(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: predioId, unidadeId } = await params

    if (!isValidUUID(predioId) || !isValidUUID(unidadeId)) {
      return bad('IDs inválidos')
    }

    // Verifica se a unidade pertence ao prédio
    const unidade = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId, ativo: true },
      select: { id: true }
    })

    if (!unidade) {
      return notFound('Unidade não encontrada')
    }

    const body = await req.json()
    const data = ResponsavelCreateSchema.parse(body)

    // Se for titular de cobrança, garantir que não existe outro ativo
    if (data.ehTitularCobranca) {
      const titularExiste = await prisma.responsavel.findFirst({
        where: {
          unidadeId,
          ativo: true,
          ehTitularCobranca: true
        }
      })

      if (titularExiste) {
        return conflict('Já existe um titular de cobrança ativo para esta unidade')
      }
    }

    const novo = await prisma.responsavel.create({
      data: {
        ...data,
        unidadeId
      }
    })

    return created(novo)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return bad('Dados inválidos', error.flatten())
    }

    console.error('[POST /responsaveis]', error)
    return handlePrismaError(error)
  }
}