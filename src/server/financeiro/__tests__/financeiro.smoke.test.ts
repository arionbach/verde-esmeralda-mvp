import { prisma } from '@/lib/prisma'
import { getRelatorioFinanceiroMensalPredio } from '@/server/financeiro/relatorio-financeiro.service'
import { PagamentoStatus, PagamentoTipo } from '@prisma/client'

function startOfMonthDate(yyyyMm: string): Date {
  const [y, m] = yyyyMm.split('-').map((v) => parseInt(v, 10))
  return new Date(Date.UTC(y, m - 1, 1))
}

describe('Financeiro - Smoke (Modelo A)', () => {
  const competenciaStr = '2099-01'
  const competencia = startOfMonthDate(competenciaStr)
  const predioId = 'predio-smoke-y51'

  async function clearData() {
    await prisma.pagamento.deleteMany({
      where: { predioId, competencia: { gte: competencia, lte: new Date(Date.UTC(competencia.getUTCFullYear(), competencia.getUTCMonth() + 1, 0)) } },
    })
  }

  beforeEach(async () => {
    // Garante prédio de teste existente (FK de Pagamento)
    await prisma.predio.upsert({
      where: { id: predioId },
      create: { id: predioId, nome: 'Predio Teste', endereco: 'Endereço Teste', quantidadeUnidades: 1 },
      update: {},
    })
    await clearData()
  })

  it('Teste 1 - competência sem pagamentos', async () => {
    const r = await getRelatorioFinanceiroMensalPredio(predioId, competencia)
    expect(r.receitaPrevista).toBe(0)
    expect(r.receitaRealizada).toBe(0)
    expect(r.receitaEmAberto).toBe(0)
    expect(r.receitaAtrasada).toBe(0)
    expect(r.percentualInadimplencia).toBe(0)
  })

  it('Teste 2 - tudo pago', async () => {
    await prisma.pagamento.create({
      data: {
        predioId,
        valor: 100,
        competencia,
        vencimento: new Date(competencia.getTime()),
        tipo: PagamentoTipo.TAXA_MENSAL,
        status: PagamentoStatus.PAGO,
      },
    })
    await prisma.pagamento.create({
      data: {
        predioId,
        valor: 50,
        competencia,
        vencimento: new Date(competencia.getTime()),
        tipo: PagamentoTipo.TAXA_MENSAL,
        status: PagamentoStatus.PAGO,
      },
    })

    const r = await getRelatorioFinanceiroMensalPredio(predioId, competencia)
    expect(r.receitaPrevista).toBeGreaterThan(0)
    expect(r.receitaRealizada).toBe(r.receitaPrevista)
    expect(r.receitaEmAberto).toBe(0)
    expect(r.receitaAtrasada).toBe(0)
    expect(r.percentualInadimplencia).toBe(0)
  })

  it('Teste 3 - tudo atrasado', async () => {
    await prisma.pagamento.create({
      data: {
        predioId,
        valor: 80,
        competencia,
        vencimento: new Date(competencia.getTime() - 24 * 3600 * 1000), // vencido
        tipo: PagamentoTipo.TAXA_MENSAL,
        status: PagamentoStatus.ATRASADO,
      },
    })
    await prisma.pagamento.create({
      data: {
        predioId,
        valor: 20,
        competencia,
        vencimento: new Date(competencia.getTime() - 24 * 3600 * 1000),
        tipo: PagamentoTipo.TAXA_MENSAL,
        status: PagamentoStatus.ATRASADO,
      },
    })

    const r = await getRelatorioFinanceiroMensalPredio(predioId, competencia)
    expect(r.receitaPrevista).toBeGreaterThan(0)
    expect(r.receitaRealizada).toBe(0)
    expect(r.receitaAtrasada).toBe(r.receitaPrevista)
    expect(r.percentualInadimplencia).toBe(1)
  })
})
