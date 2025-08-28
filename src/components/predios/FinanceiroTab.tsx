// src\components\predios\FinanceiroTab.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

type Pendencia = {
  id: string
  unidadeId: string
  valor: number
  status: 'PENDENTE' | 'ATRASADO' | 'PAGO' | 'CANCELADO'
  diasAtraso: number
}
type ResumoResponse = {
  competencia: string
  kpis: {
    totalDevido: number
    totalRecebido: number
    inadimplentes: number
    inadimplenciaPct: number
  }
  pendencias: Pendencia[]
}

export default function FinanceiroTab({ predioId }: { predioId: string }) {
  const [competencia, setCompetencia] = useState(defaultCompetencia())
  const ym = useMemo(() => competencia.slice(0, 7), [competencia])

  const [resumo, setResumo] = useState<ResumoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [registrando, setRegistrando] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)

  async function carregarResumo() {
    setLoading(true)
    try {
      const r = await fetch(`/api/predios/${predioId}/financeiro/resumo?competencia=${ym}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'Falha ao carregar resumo')
      setResumo(j)
    } finally { setLoading(false) }
  }

  async function gerarMensal() {
    setGerando(true)
    try {
      const r = await fetch(`/api/predios/${predioId}/financeiro/gerar-mensal?competencia=${ym}`, { method: 'POST' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'Falha ao gerar mensalidade')
      await carregarResumo()
    } finally { setGerando(false) }
  }

  async function recalcularStatus() {
    await fetch(`/api/predios/${predioId}/financeiro/recalcular-status`, { method: 'POST' })
    await carregarResumo()
  }

  async function registrarPagamento(pagamentoId: string) {
    setRegistrando(pagamentoId)
    try {
      const r = await fetch(`/api/pagamentos/${pagamentoId}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.message ?? 'Erro ao registrar pagamento')
      await carregarResumo()
    } finally { setRegistrando(null) }
  }

  useEffect(() => { carregarResumo() }, [ym, predioId])

  return (
    <div className="space-y-4">
      {/* Filtros / ações */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Competência</label>
          <input
            type="month"
            value={ym}
            onChange={(e) => setCompetencia(e.target.value + '-01')}
            className="border rounded-lg px-3 py-2"
          />
        </div>

        <button
          onClick={gerarMensal}
          disabled={gerando}
          className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:opacity-90 disabled:opacity-40"
        >
          {gerando ? 'Gerando…' : 'Gerar mensalidade'}
        </button>

        <button
          onClick={recalcularStatus}
          className="px-3 py-2 rounded-lg border hover:bg-muted/40"
        >
          Recalcular status
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total devido" value={currency(resumo?.kpis.totalDevido ?? 0)} />
        <KpiCard title="Total recebido" value={currency(resumo?.kpis.totalRecebido ?? 0)} />
        <KpiRaw title="Unid. inadimplentes" value={String(resumo?.kpis.inadimplentes ?? 0)} />
        <KpiRaw title="% inadimplência" value={`${resumo?.kpis.inadimplenciaPct ?? 0}%`} />
      </div>

      {/* Tabela de pendências */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Th>Unidade</Th>
              <Th>Valor</Th>
              <Th>Status</Th>
              <Th>Dias atraso</Th>
              <Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {(resumo?.pendencias ?? []).map((p) => (
              <tr key={p.id} className="border-t">
                <Td>{p.unidadeId}</Td>
                <Td>{currency(p.valor)}</Td>
                <Td><StatusBadge status={p.status} /></Td>
                <Td>{p.diasAtraso}</Td>
                <Td>
                  <button
                    onClick={() => registrarPagamento(p.id)}
                    disabled={registrando === p.id || p.status === 'PAGO' || p.status === 'CANCELADO'}
                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:opacity-90 disabled:opacity-40"
                  >
                    {registrando === p.id ? 'Registrando…' : 'Registrar pagamento'}
                  </button>
                </Td>
              </tr>
            ))}
            {(!resumo || resumo.pendencias.length === 0) && (
              <tr>
                <Td colSpan={5} className="text-center text-muted-foreground py-6">
                  {loading ? 'Carregando…' : 'Nenhuma pendência para a competência selecionada.'}
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function defaultCompetencia() {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-card">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl mt-1 font-semibold">{value}</div>
    </div>
  )
}
function KpiRaw({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm bg-card">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl mt-1 font-semibold">{value}</div>
    </div>
  )
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 font-medium">{children}</th>
}
function Td({ children, colSpan, className }: { children: React.ReactNode; colSpan?: number; className?: string }) {
  return <td className={`px-4 py-3 ${className ?? ''}`} colSpan={colSpan}>{children}</td>
}
function StatusBadge({ status }: { status: Pendencia['status'] }) {
  const map: Record<Pendencia['status'], string> = {
    PENDENTE: 'bg-amber-100 text-amber-800',
    ATRASADO: 'bg-red-100 text-red-800',
    PAGO: 'bg-emerald-100 text-emerald-800',
    CANCELADO: 'bg-zinc-100 text-zinc-800'
  }
  return <span className={`px-2 py-1 rounded-md text-xs ${map[status]}`}>{status}</span>
}
function currency(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}
