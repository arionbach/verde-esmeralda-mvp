// src/app/api/predios/[id]/unidades/[unidadeId]/responsaveis/[responsavelId]/route.ts
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { ResponsavelUpdateSchema } from 'src/app/api/_schemas' // Verifique se o arquivo existe!
import {
  ok,
  bad,
  notFound,
  conflict,
  handlePrismaError,
  isValidUUID,
  noContent // Adicione aqui
} from 'src/app/api/_utils' // Remova o .ts da extensão
import { z } from 'zod'

type RouteParams = {
  params: Promise<{
    id: string
    unidadeId: string
    responsavelId: string
  }>
}

export async function PUT(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: predioId, unidadeId, responsavelId } = await params

    if (!isValidUUID(predioId) || !isValidUUID(unidadeId) || !isValidUUID(responsavelId)) {
      return bad('IDs inválidos')
    }

    // Verifica se o responsável pertence à unidade e está ativo
    const atual = await prisma.responsavel.findFirst({
      where: {
        id: responsavelId,
        unidadeId,
        ativo: true
      }
    })

    if (!atual) {
      return notFound('Responsável não encontrado ou já desativado')
    }

    const body = await req.json()
    const data = ResponsavelUpdateSchema.parse(body)

    // Se marcado como titular, remove dos demais
    if (data.ehTitularCobranca === true) {
      await prisma.responsavel.updateMany({
        where: {
          unidadeId,
          ativo: true,
          id: { not: responsavelId }
        },
        data: {
          ehTitularCobranca: false
        }
      })
    }

    const atualizado = await prisma.responsavel.update({
      where: { id: responsavelId },
      data: {
        nome: data.nome,
        cpfCnpj: data.cpfCnpj,
        telefone: data.telefone,
        whatsapp: data.whatsapp,
        email: data.email,
        tipo: data.tipo,
        ehTitularCobranca: data.ehTitularCobranca
      }
    })

    return ok(atualizado)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return bad('Dados inválidos', error.flatten())
    }

    console.error('[PUT /responsaveis]', error)
    return handlePrismaError(error)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: predioId, unidadeId, responsavelId } = await params

    if (!isValidUUID(predioId) || !isValidUUID(unidadeId) || !isValidUUID(responsavelId)) {
      return bad('IDs inválidos')
    }

    // Verifica se existe
    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: responsavelId,
        unidadeId,
        ativo: true
      }
    })

    if (!responsavel) {
      return notFound('Responsável não encontrado ou já desativado')
    }

    // Soft delete
    await prisma.responsavel.update({
      where: { id: responsavelId },
      data: {
        ativo: false,
        dataFim: new Date(),
        deletedAt: new Date()
      }
    })

    return noContent()
  } catch (error) {
    console.error('[DELETE /responsaveis]', error)
    return handlePrismaError(error)
  }
}