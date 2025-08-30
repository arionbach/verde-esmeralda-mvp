//src/components/financeiro/FinanceiroTab.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'

type Item = {
  id: string
  unidadeId: string
  unidadeNome?: string
  valor: number
  status: 'PENDENTE' | 'ATRASADO' | 'PAGO' | 'CANCELADO'
  diasAtraso: number
}

type Resumo = {
  competencia: string
  kpis: {
    totalDevido: number
    totalRecebido: number
    inadimplentes: number
    inadimplenciaPct: number
    despesasFixasMes?: number
    saldoPrevisto?: number
  }
}

type DespesaFixa = {
  id: string
  predioId: string
  nome: string
  valor: number
  diaVencimento: number
  categoria?: string | null
  dataInicio?: string | null
  dataFim?: string | null
  ativo: boolean
}

type Props = { predioId: string }

const fmtBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
const yyyyMM = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export default function FinanceiroTab({ predioId }: Props) {
  const [competencia, setCompetencia] = useState<string>(yyyyMM(new Date()))
  const [statusFiltro, setStatusFiltro] = useState<'PENDENCIAS' | 'PENDENTE' | 'ATRASADO' | 'PAGO' | 'TODOS'>('PENDENCIAS')

  const [valorPadrao, setValorPadrao] = useState<number>(350) // 👈 novo estado

  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [loadingResumo, setLoadingResumo] = useState(false)
  const [loadingTabela, setLoadingTabela] = useState(false)
  const [working, setWorking] = useState(false)
  const [erroTabela, setErroTabela] = useState<string | null>(null)
  const [despesas, setDespesas] = useState<DespesaFixa[]>([])
  const [loadingDespesas, setLoadingDespesas] = useState(false)
  const [showDespesas, setShowDespesas] = useState(false)
  const [novaDespesa, setNovaDespesa] = useState<{ nome: string; valor: number; diaVencimento: number; categoria?: string }>({ nome: '', valor: 0, diaVencimento: 10 })

  // resumo (KPIs)
  async function loadResumo() {
    setLoadingResumo(true)
    try {
      const r = await fetch(`/api/predios/${predioId}/financeiro/resumo?competencia=${competencia}`, { cache: 'no-store' })
      if (!r.ok) throw new Error((await safeJson(r))?.error || 'Falha no resumo')
      setResumo(await r.json())
    } finally {
      setLoadingResumo(false)
    }
  }

  // tabela com filtros
  async function loadTabela() {
    setLoadingTabela(true)
    setErroTabela(null)
    try {
      const r = await fetch(
        `/api/predios/${predioId}/financeiro/pagamentos?competencia=${competencia}&status=${statusFiltro}`,
        { cache: 'no-store' }
      )
      if (!r.ok) throw new Error((await safeJson(r))?.error || 'Falha na lista de pagamentos')
      const j = await r.json()
      setItens(j.itens)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao carregar pagamentos'
      setErroTabela(msg)
      setItens([])
    } finally {
      setLoadingTabela(false)
    }
  }

  useEffect(() => {
    if (!predioId) return
    loadResumo()
    loadTabela()
    loadDespesasFixas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predioId, competencia, statusFiltro])

  async function gerarMensalidade() {
    setWorking(true)
    try {
      const v = Number.isFinite(valorPadrao) ? valorPadrao : 0
      const url =
        `/api/predios/${predioId}/financeiro/mensalidades` +
        `?competencia=${competencia}&valorPadrao=${encodeURIComponent(String(v))}` // 👈 envia valor
      const r = await fetch(url, { method: 'POST' })
      if (!r.ok) throw new Error((await safeJson(r))?.error || 'Falha ao gerar')
      await Promise.all([loadResumo(), loadTabela()])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar mensalidade'
      alert(msg)
    } finally {
      setWorking(false)
    }
  }

  async function loadDespesasFixas() {
    setLoadingDespesas(true)
    try {
      const r = await fetch(`/api/predios/${predioId}/financeiro/despesas-fixas`, { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Falha ao carregar despesas')
      setDespesas(j.itens || [])
    } catch (e) {
      console.error(e)
      setDespesas([])
    } finally {
      setLoadingDespesas(false)
    }
  }

  async function recalcularStatus() {
    setWorking(true)
    try {
      const r = await fetch(`/api/predios/${predioId}/financeiro/recalcular?competencia=${competencia}`, { method: 'POST' })
      if (!r.ok) throw new Error((await safeJson(r))?.error || 'Falha ao recalcular')
      await Promise.all([loadResumo(), loadTabela()])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao recalcular'
      alert(msg)
    } finally {
      setWorking(false)
    }
  }

  async function marcarPago(id: string) {
    if (!confirm('Confirmar recebimento?')) return
    const prev = itens
    setItens((rows) => rows.filter((r) => r.id !== id)) // otimista
    try {
      const r = await fetch(`/api/pagamentos/${id}/pagar`, { method: 'PATCH' })
      if (!r.ok) throw new Error((await safeJson(r))?.error || 'Falha ao pagar')
      await Promise.all([loadResumo(), loadTabela()])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao marcar pago'
      alert(msg)
      setItens(prev) // rollback
    }
  }

  async function estornar(id: string) {
    if (!confirm('Estornar este pagamento?')) return
    const prev = itens
    setItens((rows) => rows.filter((r) => r.id !== id)) // otimista
    try {
      const r = await fetch(`/api/pagamentos/${id}/estornar`, { method: 'PATCH' })
      if (!r.ok) throw new Error((await safeJson(r))?.error || 'Falha ao estornar')
      await Promise.all([loadResumo(), loadTabela()])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao estornar'
      alert(msg)
      setItens(prev) // rollback
    }
  }

  const kpis = useMemo(
    () => [
      { label: 'Total devido', value: fmtBRL(resumo?.kpis.totalDevido ?? 0) },
      { label: 'Total recebido', value: fmtBRL(resumo?.kpis.totalRecebido ?? 0) },
      { label: 'Unid. inadimplentes', value: `${resumo?.kpis.inadimplentes ?? 0}` },
      { label: '% inadimplência', value: `${(resumo?.kpis.inadimplenciaPct ?? 0).toFixed(0)}%` },
      { label: 'Despesas fixas (mês)', value: fmtBRL(resumo?.kpis.despesasFixasMes ?? 0) },
      { label: 'Saldo previsto', value: fmtBRL(resumo?.kpis.saldoPrevisto ?? 0) },
    ],
    [resumo]
  )

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Competência</label>
          <input
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Valor padrão</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={valorPadrao}
            onChange={(e) => setValorPadrao(Number(e.target.value || 0))}
            className="w-28 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
          />
        </div>

        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as any)}
          className="border rounded-lg px-3 py-2"
          title="Filtrar status"
        >
          <option value="PENDENCIAS">Pendências (todos)</option>
          <option value="PENDENTE">Somente pendentes</option>
          <option value="ATRASADO">Somente atrasados</option>
          <option value="PAGO">Pagos</option>
          <option value="TODOS">Todos</option>
        </select>

        <button
          onClick={gerarMensalidade}
          disabled={working}
          className="bg-verde-esmeralda-600 text-white px-4 py-2 rounded-lg hover:bg-verde-esmeralda-700 disabled:opacity-50"
        >
          Gerar mensalidade
        </button>

        <button
          onClick={recalcularStatus}
          disabled={working}
          className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg hover:bg-emerald-200 disabled:opacity-50"
        >
          Recalcular status
        </button>

        <button
          onClick={() => { loadResumo(); loadTabela(); }}
          disabled={loadingResumo || loadingTabela}
          className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
        >
          Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">{k.label}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-800">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Despesas Fixas (CRUD simples) */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">Despesas Fixas</div>
          <button onClick={() => setShowDespesas((v) => !v)} className="text-sm text-verde-esmeralda-700 hover:underline">
            {showDespesas ? 'Ocultar' : 'Gerenciar'}
          </button>
        </div>
        {showDespesas && (
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input className="border rounded-lg px-3 py-2" placeholder="Nome" value={novaDespesa.nome}
                     onChange={(e) => setNovaDespesa({ ...novaDespesa, nome: e.target.value })} />
              <input className="border rounded-lg px-3 py-2" placeholder="Valor" type="number" min={0} step="0.01" value={novaDespesa.valor}
                     onChange={(e) => setNovaDespesa({ ...novaDespesa, valor: Number(e.target.value || 0) })} />
              <input className="border rounded-lg px-3 py-2" placeholder="Dia venc." type="number" min={1} max={28} value={novaDespesa.diaVencimento}
                     onChange={(e) => setNovaDespesa({ ...novaDespesa, diaVencimento: Number(e.target.value || 1) })} />
              <div className="flex gap-2">
                <input className="border rounded-lg px-3 py-2 flex-1" placeholder="Categoria (opcional)" value={novaDespesa.categoria || ''}
                       onChange={(e) => setNovaDespesa({ ...novaDespesa, categoria: e.target.value })} />
                <button
                  className="bg-verde-esmeralda-600 text-white px-4 py-2 rounded-lg hover:bg-verde-esmeralda-700"
                  onClick={async () => {
                    try {
                      const r = await fetch(`/api/predios/${predioId}/financeiro/despesas-fixas`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(novaDespesa),
                      })
                      const j = await r.json().catch(() => ({}))
                      if (!r.ok) throw new Error(j?.error || 'Falha ao criar despesa')
                      setNovaDespesa({ nome: '', valor: 0, diaVencimento: 10 })
                      await Promise.all([loadDespesasFixas(), loadResumo()])
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : 'Erro ao criar despesa'
                      alert(msg)
                    }
                  }}
                >
                  Adicionar
                </button>
              </div>
            </div>

            {loadingDespesas ? (
              <div className="text-gray-500">Carregando despesas.</div>
            ) : despesas.length === 0 ? (
              <div className="text-gray-500">Nenhuma despesa fixa cadastrada.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Nome</th>
                      <th className="px-3 py-2 text-left">Valor</th>
                      <th className="px-3 py-2 text-left">Vencimento</th>
                      <th className="px-3 py-2 text-left">Categoria</th>
                      <th className="px-3 py-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.map((d) => (
                      <tr key={d.id} className="border-t">
                        <td className="px-3 py-2">{d.nome}</td>
                        <td className="px-3 py-2">{fmtBRL(d.valor)}</td>
                        <td className="px-3 py-2">dia {d.diaVencimento}</td>
                        <td className="px-3 py-2">{d.categoria || '-'}</td>
                        <td className="px-3 py-2">
                          <button
                            className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200"
                            onClick={async () => {
                              if (!confirm('Excluir esta despesa?')) return
                              try {
                                const r = await fetch(`/api/predios/${predioId}/financeiro/despesas-fixas/${d.id}`, { method: 'DELETE' })
                                if (!r.ok) throw new Error('Falha ao excluir')
                                await Promise.all([loadDespesasFixas(), loadResumo()])
                              } catch (e) {
                                const msg = e instanceof Error ? e.message : 'Erro ao excluir'
                                alert(msg)
                              }
                            }}
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 font-medium">Pagamentos</div>
        {loadingTabela ? (
          <div className="p-6 text-gray-500">Carregando…</div>
        ) : erroTabela ? (
          <div className="p-6 text-red-600">{erroTabela}</div>
        ) : itens.length === 0 ? (
          <div className="p-6 text-gray-500">Nada a exibir para o filtro selecionado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-4 py-3 font-medium text-gray-600">Unidade</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Valor</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Dias atraso</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-3">{p.unidadeNome || p.unidadeId}</td>
                    <td className="px-4 py-3">{fmtBRL(p.valor)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          p.status === 'ATRASADO' ? 'bg-red-100 text-red-800'
                            : p.status === 'PENDENTE' ? 'bg-amber-100 text-amber-800'
                            : p.status === 'PAGO' ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-700',
                        ].join(' ')}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.diasAtraso}</td>
                    <td className="px-4 py-3 space-x-2">
                      {p.status !== 'PAGO' ? (
                        <button onClick={() => marcarPago(p.id)} className="bg-verde-esmeralda-600 text-white px-3 py-1.5 rounded-lg hover:bg-verde-esmeralda-700">
                          Marcar pago
                        </button>
                      ) : (
                        <button onClick={() => estornar(p.id)} className="bg-rose-100 text-rose-800 px-3 py-1.5 rounded-lg hover:bg-rose-200">
                          Estornar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

async function safeJson(r: Response) { try { return await r.json() } catch { return null } }

