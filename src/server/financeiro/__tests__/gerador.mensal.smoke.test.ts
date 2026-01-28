import { prisma } from '@/lib/prisma'
import { gerarPagamentosDaCompetencia } from '@/server/financeiro/gerador-pagamentos.service'
import { setCompetenciaStatus } from '@/server/financeiro/competencia-status.service'
import { PagamentoTipo, PagamentoStatus } from '@prisma/client'

function som(yyyyMm: string) {
  const [y,m] = yyyyMm.split('-').map(Number); return new Date(Date.UTC(y, m-1, 1))
}

describe('Gerador de Pagamentos da Competência (CICLO 7) — Smoke', () => {
  const predioId = 'predio-smk-c7'
  const unidadeId = 'unidade-smk-1'
  const competenciaStr = '2099-04'
  const competencia = som(competenciaStr)

  async function clearAll() {
    await prisma.competenciaStatus.deleteMany({ where: { predioId, competencia } })
    await prisma.pagamento.deleteMany({ where: { predioId, competencia } })
    await prisma.ajusteUnidade.deleteMany({ where: { predioId, competencia } })
    await prisma.rateioItem.deleteMany({ where: { predioId, competencia } })
    await prisma.unidade.deleteMany({ where: { id: unidadeId } })
    await prisma.predio.deleteMany({ where: { id: predioId } })
  }

  beforeEach(async () => {
    await clearAll()
    await prisma.predio.create({ data: { id: predioId, nome: 'P', endereco: 'E', quantidadeUnidades: 1 } })
    await prisma.unidade.create({ data: { id: unidadeId, predioId, numero: '101', valorTaxa: 0 as any, ativo: true, tipo: 'APARTAMENTO' as any, status: 'OCUPADO' as any } })
  })

  it('Geração simples (sem ajustes)', async () => {
    await prisma.rateioItem.create({ data: { predioId, unidadeId, competencia, valor: 100 as any, origemTipo: 'DESPESA_FIXA' as any, descricao: 'Despesa fixa' } })
    const r = await gerarPagamentosDaCompetencia(predioId, competenciaStr, 'test')
    expect(r.created).toBe(1)
    const sum = await prisma.pagamento.aggregate({ _sum: { valor: true }, where: { predioId, competencia, tipo: 'TAXA_MENSAL' as any } })
    expect(Number(sum._sum.valor ?? 0)).toBe(100)
  })

  it('Geração com EXCECAO crédito (30) → 70', async () => {
    await prisma.rateioItem.create({ data: { predioId, unidadeId, competencia, valor: 100 as any, origemTipo: 'DESPESA_FIXA' as any, descricao: 'Despesa fixa' } })
    await prisma.ajusteUnidade.create({ data: { predioId, unidadeId, competencia, tipoPolitica: 'EXCECAO' as any, natureza: 'CREDITO' as any, valor: 30 as any, descricao: 'ex' } })
    await gerarPagamentosDaCompetencia(predioId, competenciaStr, 'test')
    const sum = await prisma.pagamento.aggregate({ _sum: { valor: true }, where: { predioId, competencia, tipo: 'TAXA_MENSAL' as any } })
    expect(Number(sum._sum.valor ?? 0)).toBe(70)
  })

  it('Geração com débito (20) → 120', async () => {
    await prisma.rateioItem.create({ data: { predioId, unidadeId, competencia, valor: 100 as any, origemTipo: 'DESPESA_FIXA' as any, descricao: 'Despesa fixa' } })
    await prisma.ajusteUnidade.create({ data: { predioId, unidadeId, competencia, tipoPolitica: 'EXCECAO' as any, natureza: 'DEBITO' as any, valor: 20 as any, descricao: 'deb' } })
    await gerarPagamentosDaCompetencia(predioId, competenciaStr, 'test')
    const sum = await prisma.pagamento.aggregate({ _sum: { valor: true }, where: { predioId, competencia, tipo: 'TAXA_MENSAL' as any } })
    expect(Number(sum._sum.valor ?? 0)).toBe(120)
  })

  it('Rodar duas vezes - não duplica', async () => {
    await prisma.rateioItem.create({ data: { predioId, unidadeId, competencia, valor: 100 as any, origemTipo: 'DESPESA_FIXA' as any, descricao: 'Despesa fixa' } })
    await gerarPagamentosDaCompetencia(predioId, competenciaStr, 'test')
    const r2 = await gerarPagamentosDaCompetencia(predioId, competenciaStr, 'test')
    expect(r2.created).toBe(0)
    const count = await prisma.pagamento.count({ where: { predioId, competencia, tipo: 'TAXA_MENSAL' as any } })
    expect(count).toBe(1)
  })

  it('Execuções paralelas - não duplica', async () => {
    await prisma.rateioItem.create({ data: { predioId, unidadeId, competencia, valor: 100 as any, origem: 'DESPESA_FIXA' as any, origemTipo: 'DESPESA_FIXA' as any } })
    await Promise.all([
      gerarPagamentosDaCompetencia(predioId, competenciaStr, 'test'),
      gerarPagamentosDaCompetencia(predioId, competenciaStr, 'test'),
    ])
    const count = await prisma.pagamento.count({ where: { predioId, competencia, tipo: 'TAXA_MENSAL' as any } })
    expect(count).toBe(1)
  })

  it('Competência FECHADA - falha', async () => {
    await setCompetenciaStatus({ predioId, competencia, status: 'FECHADA', usuario: 'test' })
    const r = await gerarPagamentosDaCompetencia(predioId, competenciaStr, 'test')
    expect(r.created).toBe(0)
    expect(r.skipped).toBeGreaterThan(0)
  })
})
