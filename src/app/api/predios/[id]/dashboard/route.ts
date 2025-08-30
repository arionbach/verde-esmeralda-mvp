import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { UnidadeStatus, UnidadeTipo } from "@prisma/client"
import { toUnidadeStatusEnum, toUnidadeTipoEnum } from "@/domain/unidades"

// Helpers para aceitar valores em minúsculas do front
function normalizeTipo(v: any | undefined): UnidadeTipo | undefined {
  if (v == null) return undefined
  return toUnidadeTipoEnum(v)
}

function normalizeStatus(v: any | undefined): UnidadeStatus | undefined {
  if (v == null) return undefined
  return toUnidadeStatusEnum(v)
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; unidadeId: string }> }
) {
  try {
    const { id: predioId, unidadeId } = await ctx.params

    const unidade = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId, ativo: true },
      include: {
        responsaveis: {
          where: { ativo: true },
          orderBy: { dataInicio: "desc" },
          select: { id: true, nome: true, tipo: true, ehTitularCobranca: true },
          take: 1,
        },
      },
    })

    if (!unidade) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 })
    }

    return NextResponse.json(unidade, { status: 200 })
  } catch (e) {
    console.error("[UNIDADE][GET] erro:", e)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string; unidadeId: string }> }
) {
  try {
    const { id: predioId, unidadeId } = await ctx.params

    // Garante que pertence ao prédio informado
    const exists = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId, ativo: true },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 })
    }

    const body = await req.json()

    const data: any = {}
    if (body.numero !== undefined) data.numero = String(body.numero)
    if (body.numeroInt !== undefined) data.numeroInt = body.numeroInt ?? null
    if (body.metragem !== undefined) data.metragem = body.metragem ?? null
    if (body.fracaoIdeal !== undefined) data.fracaoIdeal = body.fracaoIdeal ?? null
    if (body.valorTaxa !== undefined) data.valorTaxa = Number(body.valorTaxa)
    if (body.ativo !== undefined) data.ativo = Boolean(body.ativo)

    const tipoNorm = normalizeTipo(body.tipo)
    if (tipoNorm) data.tipo = tipoNorm

    const statusNorm = normalizeStatus(body.status)
    if (statusNorm) data.status = statusNorm

    const updated = await prisma.unidade.update({
      where: { id: unidadeId },
      data,
    })

    return NextResponse.json(updated, { status: 200 })
  } catch (e) {
    console.error("[UNIDADE][PUT] erro:", e)
    return NextResponse.json({ error: "Erro ao atualizar unidade" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; unidadeId: string }> }
) {
  try {
    const { id: predioId, unidadeId } = await ctx.params

    // soft delete (mantém histórico)
    const exists = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId, ativo: true },
      select: { id: true },
    })
    if (!exists) {
      return NextResponse.json({ error: "Unidade não encontrada" }, { status: 404 })
    }

    await prisma.unidade.update({
      where: { id: unidadeId },
      data: { ativo: false, deletedAt: new Date() },
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error("[UNIDADE][DELETE] erro:", e)
    return NextResponse.json({ error: "Erro ao excluir unidade" }, { status: 500 })
  }
}
