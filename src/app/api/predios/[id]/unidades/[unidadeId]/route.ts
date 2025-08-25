// src/app/api/predios/[id]/unidades/[unidadeId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UnidadeUpdateSchema } from '../../../../_schemas'
import { ok, notFound, bad, conflict, noContent, handlePrismaError } from '../../../../_utils'
import { z } from 'zod'
import { UnidadeTipo, UnidadeStatus } from '@prisma/client'

type RouteCtx = { params: { id: string; unidadeId: string } }

// Aceita cuid() e UUID simples
function isValidId(id: string) {
  if (!id) return false
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const cuidLike = /^[a-z0-9]{10,32}$/i
  return uuid.test(id) || cuidLike.test(id)
}

function normalizeTipo(tipo: string | undefined): UnidadeTipo | undefined {
  if (!tipo) return undefined
  const map: Record<string, UnidadeTipo> = {
    apartamento: UnidadeTipo.APARTAMENTO,
    cobertura: UnidadeTipo.COBERTURA,
    loja: UnidadeTipo.LOJA,
    garagem: UnidadeTipo.GARAGEM,
    APARTAMENTO: UnidadeTipo.APARTAMENTO,
    COBERTURA: UnidadeTipo.COBERTURA,
    LOJA: UnidadeTipo.LOJA,
    GARAGEM: UnidadeTipo.GARAGEM,
  }
  return map[tipo]
}

function normalizeStatus(status: string | undefined): UnidadeStatus | undefined {
  if (!status) return undefined
  const map: Record<string, UnidadeStatus> = {
    ocupado: UnidadeStatus.OCUPADO,
    vazio: UnidadeStatus.VAZIO,
    OCUPADO: UnidadeStatus.OCUPADO,
    VAZIO: UnidadeStatus.VAZIO,
  }
  return map[status]
}

/** GET /api/predios/[id]/unidades/[unidadeId] */
export async function GET(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id: predioId, unidadeId } = params
    const incluirInativos = req.nextUrl.searchParams.get('inativos') === '1'

    const unidade = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId, ativo: true },
      include: {
        predio: { select: { id: true, nome: true, endereco: true } },
        responsaveis: {
          where: incluirInativos ? {} : { ativo: true },   // <- aqui
          orderBy: { dataInicio: 'desc' },
          select: {
            id: true, nome: true, cpfCnpj: true, telefone: true, whatsapp: true,
            email: true, tipo: true, ehTitularCobranca: true, dataInicio: true,
            ativo: true, dataFim: true
          }
        },
        pagamentos: {
          orderBy: { vencimento: 'desc' },
          take: 12,
          select: {
            id: true, tipo: true, valor: true, competencia: true,
            vencimento: true, dataPagamento: true, status: true
          }
        }
      }
    })
    if (!unidade) return notFound('Unidade não encontrada')

    const now = new Date()
    const pendentes = unidade.pagamentos.filter(p => p.status === 'PENDENTE')
    const vencidos = pendentes.filter(p => p.vencimento < now)

    const unidadeFormatada = {
      id: unidade.id,
      numero: unidade.numero,
      tipo: unidade.tipo.toLowerCase(),
      status: unidade.status.toLowerCase(),
      metragem: unidade.metragem,
      fracaoIdeal: unidade.fracaoIdeal,
      valorTaxa: Number(unidade.valorTaxa),
      predio: unidade.predio,
      responsaveis: unidade.responsaveis,
      financeiro: {
        pagamentosPendentes: pendentes.length,
        pagamentosVencidos: vencidos.length,
        valorDevido: vencidos.reduce((sum, p) => sum + Number(p.valor), 0),
        historicoPagamentos: unidade.pagamentos.map(p => ({ ...p, valor: Number(p.valor) })),
      },
      createdAt: unidade.createdAt,
      updatedAt: unidade.updatedAt,
    }

    return ok(unidadeFormatada)
  } catch (error) {
    console.error('[GET /api/predios/[id]/unidades/[unidadeId]]', error)
    return handlePrismaError(error)
  }
}

/** PUT /api/predios/[id]/unidades/[unidadeId] */
export async function PUT(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id: predioId, unidadeId } = params
    if (!isValidId(predioId) || !isValidId(unidadeId)) return bad('ID inválido')

    const unidadeAtual = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId, ativo: true },
      select: { id: true, numero: true }
    })
    if (!unidadeAtual) return notFound('Unidade não encontrada')

    const body = await req.json()
    const normalizedBody = {
      ...body,
      ...(body.tipo && { tipo: normalizeTipo(body.tipo) }),
      ...(body.status && { status: normalizeStatus(body.status) }),
    }
    const data = UnidadeUpdateSchema.parse(normalizedBody)

    if (data.numero && data.numero !== unidadeAtual.numero) {
      const duplicada = await prisma.unidade.findFirst({
        where: { predioId, numero: data.numero, ativo: true, NOT: { id: unidadeId } },
        select: { id: true }
      })
      if (duplicada) return conflict(`Já existe uma unidade com o número "${data.numero}" neste prédio`)
    }

    const numeroInt = data.numero ? parseInt(data.numero.replace(/\D/g, '')) || 0 : undefined

    const unidade = await prisma.unidade.update({
      where: { id: unidadeId },
      data: {
        ...(data.numero !== undefined && { numero: data.numero, numeroInt }),
        ...(data.tipo !== undefined && { tipo: data.tipo }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.metragem !== undefined && { metragem: data.metragem }),
        ...(data.fracaoIdeal !== undefined && { fracaoIdeal: data.fracaoIdeal }),
        ...(data.valorTaxa !== undefined && { valorTaxa: data.valorTaxa }),
      },
      include: {
        responsaveis: { where: { ativo: true }, take: 1 }
      }
    })

    const unidadeFormatada = {
      ...unidade,
      tipo: unidade.tipo.toLowerCase(),
      status: unidade.status.toLowerCase(),
      valorTaxa: Number(unidade.valorTaxa),
      responsavel: unidade.responsaveis[0] || null,
    }

    return ok(unidadeFormatada)
  } catch (error) {
    if (error instanceof z.ZodError) return bad('Dados inválidos', error.flatten())
    console.error('[PUT /api/predios/[id]/unidades/[unidadeId]]', error)
    return handlePrismaError(error)
  }
}

/** DELETE /api/predios/[id]/unidades/[unidadeId] */
export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  try {
    const { id: predioId, unidadeId } = params
    if (!isValidId(predioId) || !isValidId(unidadeId)) return bad('ID inválido')

    const unidade = await prisma.unidade.findFirst({
      where: { id: unidadeId, predioId, ativo: true },
      select: { id: true, numero: true }
    })
    if (!unidade) return notFound('Unidade não encontrada')

    // ❗ Conte os relacionados com queries separadas (não use where dentro do _count)
    const [qtdRespAtivos, qtdPagPendentes] = await Promise.all([
      prisma.responsavel.count({ where: { unidadeId, ativo: true } }),
      prisma.pagamento.count({ where: { unidadeId, status: 'PENDENTE' } }),
    ])

    if (qtdPagPendentes > 0) {
      return conflict(
        `A unidade ${unidade.numero} possui ${qtdPagPendentes} pagamento(s) pendente(s). ` +
        `Resolva as pendências antes de excluir.`
      )
    }

    // Soft delete da unidade
    await prisma.unidade.update({
      where: { id: unidadeId },
      data: { ativo: false, deletedAt: new Date() }
    })

    // Desativa responsáveis também (se houver)
    if (qtdRespAtivos > 0) {
      await prisma.responsavel.updateMany({
        where: { unidadeId, ativo: true },
        data: { ativo: false, dataFim: new Date() }
      })
    }

    return noContent()
  } catch (error) {
    console.error('[DELETE /api/predios/[id]/unidades/[unidadeId]]', error)
    return handlePrismaError(error)
  }
}
