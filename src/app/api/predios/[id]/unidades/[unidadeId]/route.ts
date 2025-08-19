// src/app/api/predios/[id]/unidades/[unidadeId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const UnidadeUpdateSchema = z.object({
  numero: z.string().min(1).transform(s => s.trim()).optional(),
  tipo: z.enum(['apartamento', 'cobertura', 'loja', 'garagem']).optional(),
  metragem: z.number().positive().nullable().optional(),
  fracaoIdeal: z.number().min(0).max(100).nullable().optional(),
  valorTaxa: z.number().min(0).optional(),
  status: z.enum(['ocupado', 'vazio']).optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; unidadeId: string } }
) {
  const { id: predioId, unidadeId } = params
  try {
    const unidade = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId },
      include: {
        responsaveis: { orderBy: { dataInicio: 'desc' } },
        pagamentos: true,
      },
    })
    if (!unidade) return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 })
    return NextResponse.json(unidade)
  } catch (e) {
    console.error('[UNIDADE][GET] erro:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; unidadeId: string } }
) {
  const { id: predioId, unidadeId } = params
  try {
    const body = await req.json()
    const parsed = UnidadeUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    // precisa pertencer ao mesmo prédio
    const atual = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId },
      include: { responsaveis: { where: { ativo: true } } },
    })
    if (!atual) return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 })

    // se mudar número → checar duplicidade dentro do prédio
    if (data.numero && data.numero !== atual.numero) {
      const conflito = await prisma.unidade.findFirst({
        where: { predioId, numero: data.numero, NOT: { id: unidadeId } },
        select: { id: true },
      })
      if (conflito) {
        return NextResponse.json(
          { error: 'Já existe outra unidade com este número neste prédio.' },
          { status: 409 }
        )
      }
    }

    // coerência status x responsável ativo
    if (data.status === 'vazio' && atual.responsaveis.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível marcar como vazio com responsável ativo. Remova/desative o responsável primeiro.' },
        { status: 409 }
      )
    }

    const updated = await prisma.unidade.update({
      where: { id: unidadeId },
      data: {
        numero: data.numero ?? atual.numero,
        tipo: data.tipo ?? atual.tipo,
        metragem: data.metragem ?? atual.metragem,
        fracaoIdeal: data.fracaoIdeal ?? atual.fracaoIdeal,
        valorTaxa: data.valorTaxa ?? atual.valorTaxa,
        status: data.status ?? atual.status,
      },
    })
    return NextResponse.json(updated)
  } catch (e) {
    console.error('[UNIDADE][PUT] erro:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; unidadeId: string } }
) {
  const { id: predioId, unidadeId } = params
  try {
    const atual = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId },
      include: {
        responsaveis: { where: { ativo: true }, select: { id: true } },
        _count: { select: { pagamentos: true } },
      },
    })
    if (!atual) return NextResponse.json({ error: 'Unidade não encontrada' }, { status: 404 })

    if (atual._count.pagamentos > 0) {
      return NextResponse.json(
        { error: 'Unidade possui histórico financeiro. Exclusão bloqueada.' },
        { status: 409 }
      )
    }
    if (atual.responsaveis.length > 0) {
      return NextResponse.json(
        { error: 'Unidade com responsável ativo. Desative/remova o responsável antes de excluir.' },
        { status: 409 }
      )
    }

    await prisma.unidade.delete({ where: { id: unidadeId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[UNIDADE][DELETE] erro:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
