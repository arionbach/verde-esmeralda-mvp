import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, bad, handlePrismaError, isValidUUID } from '@/app/api/_utils'
import { PagamentoStatus, PagamentoTipo } from '@prisma/client'
import { startOfMonth, endOfMonth, parse } from 'date-fns'

type RouteCtx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteCtx) {
  try {
    const { id: predioId } = await params
    if (!isValidUUID(predioId)) return bad('ID do prédio inválido')

    const { searchParams } = new URL(req.url)
    const competenciaStr = searchParams.get('competencia')
    if (!competenciaStr || competenciaStr.length < 7) {
      return bad('Competência inválida. Use YYYY-MM')
    }

    // valor padrão opcional vindo da UI (ex.: 350)
    const valorPadrao = Number(searchParams.get('valorPadrao') ?? '0') || 0

    // “modo brutal” por padrão: atualiza existentes
    const sobrescrever = searchParams.get('sobrescrever') !== '0'

    // datas da competência
    const competencia = parse(competenciaStr, 'yyyy-MM', new Date())
    const inicio = startOfMonth(competencia)
    const fim = endOfMonth(competencia)

    // escolha do dia de vencimento (fixo em 10; ajuste se quiser ler de outro lugar)
    const vencimento = new Date(inicio.getFullYear(), inicio.getMonth(), 10)

    // pega unidades ativas do prédio com seu valorTaxa
    const unidades = await prisma.unidade.findMany({
      where: { predioId, ativo: true },
      select: { id: true, valorTaxa: true },
    })

    let created = 0
    let updated = 0
    let skipped = 0

    for (const u of unidades) {
      const valorUnidade = Number(u.valorTaxa ?? 0)
      const valor = valorUnidade > 0 ? valorUnidade : valorPadrao

      // sem valor: não cria nada
      if (!valor || valor <= 0) {
        skipped++
        continue
      }

      // já existe TAXA_MENSAL dessa competência para essa unidade?
      const existing = await prisma.pagamento.findFirst({
        where: {
          predioId,
          unidadeId: u.id,
          tipo: PagamentoTipo.TAXA_MENSAL,
          competencia: { gte: inicio, lte: fim },
        },
        select: { id: true, valor: true },
      })

      if (existing) {
        if (sobrescrever) {
          await prisma.pagamento.update({
            where: { id: existing.id },
            data: {
              valor,
              vencimento,
              status: PagamentoStatus.PENDENTE,
            },
          })
          updated++
        } else {
          skipped++
        }
      } else {
        await prisma.pagamento.create({
          data: {
            predio:  { connect: { id: predioId } },
            unidade: { connect: { id: u.id } },
            tipo: PagamentoTipo.TAXA_MENSAL,
            status: PagamentoStatus.PENDENTE,
            competencia: inicio,
            vencimento,
            valor,
          },
        })
        created++
      }
    }

    return ok({
      competencia: competenciaStr,
      resumo: { created, updated, skipped, totalUnidades: unidades.length },
    })
  } catch (err) {
    console.error('[POST /financeiro/mensalidades]', err)
    return handlePrismaError(err)
  }
}
