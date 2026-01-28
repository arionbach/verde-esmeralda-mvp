// src/server/financeiro/gerador-pagamentos.service.ts
// CICLO 7 — Gerador explícito, idempotente e governado
// Converte (Σ RateioItem + Σ AjusteUnidade) em Pagamento(TAXA_MENSAL) por competência.
// Regras: Decimal end-to-end; FECHADA bloqueia; idempotência por (predioId, unidadeId, competencia, tipo).

import { prisma } from '@/lib/prisma'
import { PagamentoStatus, PagamentoTipo, NaturezaLancamento, Prisma } from '@prisma/client'
import { endOfMonth, startOfMonth, parse } from 'date-fns'
import { isCompetenciaFechada } from '@/server/financeiro/competencia-status.service'

export type GeradorResumo = { competencia: string; created: number; skipped: number; totalUnidades: number }

export function parseCompetenciaYYMM(competencia: string) {
  const base = competencia?.slice(0, 7)
  const comp = parse(base, 'yyyy-MM', new Date())
  if (isNaN(comp.getTime())) throw new Error('Competência inválida. Use YYYY-MM')
  return { competenciaStr: base!, inicio: startOfMonth(comp), fim: endOfMonth(comp) }
}

export async function gerarPagamentosDaCompetencia(
  predioId: string,
  competenciaStr: string,
  usuario: string | null = 'system',
  opts?: { vencimentoDia?: number }
): Promise<GeradorResumo> {
  const { inicio, fim, competenciaStr: compTxt } = parseCompetenciaYYMM(competenciaStr)
  if (await isCompetenciaFechada(predioId, inicio)) {
    throw new Error('Competência fechada. Operação não permitida.')
  }

  const unidades = await prisma.unidade.findMany({ where: { predioId, ativo: true }, select: { id: true } })
  let created = 0
  let skipped = 0

  const dia = opts?.vencimentoDia && opts.vencimentoDia >= 1 && opts.vencimentoDia <= 28 ? opts.vencimentoDia : 10
  const vencimento = new Date(inicio.getFullYear(), inicio.getMonth(), dia)

  for (const u of unidades) {
    const unidadeId = u.id

    // Σ RateioItem
    const rateios = await prisma.rateioItem.groupBy({
      by: ['unidadeId'],
      where: { predioId, competencia: inicio, unidadeId },
      _sum: { valor: true },
    })
    const base = new Prisma.Decimal(rateios[0]?._sum?.valor ?? 0)

    // Σ AjusteUnidade (todas as políticas, incluindo EXCECAO)
    const ajustes = await prisma.ajusteUnidade.findMany({
      where: { predioId, unidadeId, competencia: inicio },
      select: { valor: true, natureza: true },
    })
    let somaAjuste = new Prisma.Decimal(0)
    for (const a of ajustes) {
      const val = new Prisma.Decimal(a.valor as any)
      somaAjuste = a.natureza === NaturezaLancamento.DEBITO ? somaAjuste.plus(val) : somaAjuste.minus(val)
    }

    const valorFinal = base.plus(somaAjuste)
    if (valorFinal.lt(0)) throw new Error('Valor final negativo. Operação não permitida.')
    if (valorFinal.eq(0)) {
      skipped++
      continue
    }

    // Idempotência/concorrência: criar respeitando unicidade; em colisão, contabilizar como skipped
    try {
      await prisma.pagamento.create({
        data: {
          predioId,
          unidadeId,
          tipo: PagamentoTipo.TAXA_MENSAL,
          status: PagamentoStatus.PENDENTE,
          competencia: inicio,
          vencimento,
          valor: valorFinal as any,
        },
      })
      created++
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // duplicidade pela constraint única → idempotente (skip)
        skipped++
      } else {
        throw e
      }
    }
  }

  return { competencia: compTxt, created, skipped, totalUnidades: unidades.length }
}
