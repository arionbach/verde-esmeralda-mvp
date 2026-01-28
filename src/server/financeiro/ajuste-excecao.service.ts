// src/server/financeiro/ajuste-excecao.service.ts
import { prisma } from '@/lib/prisma'
import { NaturezaLancamento, Prisma, TipoPoliticaAjuste } from '@prisma/client'

export async function upsertAjusteExcecao(params: {
  predioId: string
  unidadeId: string
  competencia: Date
  natureza: NaturezaLancamento
  valor: Prisma.Decimal
  descricao: string
}) {
  const { predioId, unidadeId, competencia, natureza, valor, descricao } = params

  const existing = await prisma.ajusteUnidade.findFirst({
    where: {
      predioId,
      unidadeId,
      competencia,
      tipoPolitica: TipoPoliticaAjuste.EXCECAO,
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  if (existing) {
    return prisma.ajusteUnidade.update({
      where: { id: existing.id },
      data: {
        natureza,
        valor, // Decimal
        descricao,
        tipoPolitica: TipoPoliticaAjuste.EXCECAO,
      },
      select: {
        id: true,
        predioId: true,
        unidadeId: true,
        competencia: true,
        tipoPolitica: true,
        natureza: true,
        valor: true,
        descricao: true,
      },
    })
  }

  return prisma.ajusteUnidade.create({
    data: {
      predioId,
      unidadeId,
      competencia,
      tipoPolitica: TipoPoliticaAjuste.EXCECAO,
      natureza,
      valor, // Decimal
      descricao,
    },
    select: {
      id: true,
      predioId: true,
      unidadeId: true,
      competencia: true,
      tipoPolitica: true,
      natureza: true,
      valor: true,
      descricao: true,
    },
  })
}

