// src/app/api/predios/[id]/unidades/[unidadeId]/responsaveis/[responsavelId]/route.ts

import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import {
  noContent, bad, notFound, handlePrismaError, isValidUUID
} from '@/app/api/_utils'

type RouteParams = {
  params: Promise<{
    id: string
    unidadeId: string
    responsavelId: string
  }>
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: predioId, unidadeId, responsavelId } = await params

    if (![predioId, unidadeId, responsavelId].every(isValidUUID)) {
      return bad('IDs inválidos')
    }

    const responsavel = await prisma.responsavel.findFirst({
      where: {
        id: responsavelId,
        unidadeId,
        ativo: true
      }
    })

    if (!responsavel) {
      return notFound('Responsável não encontrado ou já inativo')
    }

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
    console.error('[DELETE /responsavel]', error)
    return handlePrismaError(error)
  }
}
