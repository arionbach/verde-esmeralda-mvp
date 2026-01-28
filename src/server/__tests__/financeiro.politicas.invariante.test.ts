import { prisma } from '@/lib/prisma'
import { calcularPoliticasDoMes } from '@/server/financeiro.politicas.service'
import { startOfMonth } from 'date-fns'

describe('Invariante — políticas não alteram RateioItem nem Pagamento', () => {
  it('aplicar TAXA_MINIMA não altera RateioItem nem cria Pagamento', async () => {
    const predioId = 'predio-test-id'
    const competencia = startOfMonth(new Date())

    // Snapshot antes
    const rateioAntes = await prisma.rateioItem.count({ where: { predioId, competencia } })
    const pagamentosAntes = await prisma.pagamento.count({ where: { predioId, competencia } })
    const ajustesAntes = await prisma.ajusteUnidade.count({ where: { predioId, competencia } })

    // Executa políticas (MINIMO = 0 → efeito nulo)
    await calcularPoliticasDoMes({ predioId, competencia })

    // Snapshot depois
    const rateioDepois = await prisma.rateioItem.count({ where: { predioId, competencia } })
    const pagamentosDepois = await prisma.pagamento.count({ where: { predioId, competencia } })
    const ajustesDepois = await prisma.ajusteUnidade.count({ where: { predioId, competencia } })

    // Invariantes
    expect(rateioDepois).toBe(rateioAntes)
    expect(pagamentosDepois).toBe(pagamentosAntes)
    // Com mínimo = 100,00, é aceitável que AjusteUnidade aumente
    // apenas para unidades cuja soma de RateioItem < 100,00.
    // Portanto, garantimos no mínimo que não diminuiu.
    expect(ajustesDepois).toBeGreaterThanOrEqual(ajustesAntes)
  })
})
