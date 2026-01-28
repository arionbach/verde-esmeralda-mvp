// src/app/unidades/[id]/FinanceiroTab.tsx

'use client'
import { useEffect, useMemo, useState } from 'react'

type Pendencia = { id: string; unidadeId: string; valor: number; status: 'PENDENTE'|'ATRASADO'|'PAGO'|'CANCELADO'; diasAtraso: number }
type ResumoResponse = {
  competencia: string
  kpis: { totalDevido: number; totalRecebido: number; inadimplentes: number; inadimplenciaPct: number }
  pendencias: Pendencia[]
}

export default function FinanceiroUnidadeTab({ unidadeId, predioId }: { unidadeId: string; predioId: string }) {
  const [competencia, setCompetencia] = useState(defaultCompetencia())
  const ym = useMemo(() => competencia.slice(0,7), [competencia])
  const [resumo, setResumo] = useState<ResumoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [registrando, setRegistrando] = useState<string | null>(null)

  async function carregar() {
    setLoading(true)
    try {
      const r = await fetch(`/api/predios/${predioId}/unidades/${unidadeId}/financeiro/resumo?competencia=${ym}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'Falha ao carregar')
      setResumo(j)
    } finally { setLoading(false) }
  }
  async function pagar(id: string) {
    setRegistrando(id)
    try {
      const r = await fetch(`/api/pagamentos/${id}/pagar`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.message ?? 'Erro ao pagar')
      await carregar()
    } finally { setRegistrando(null) }
  }

  useEffect(() => { carregar() }, [ym, unidadeId, predioId])

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground">Competência</label>
          <input type="month" value={ym} onChange={e => setCompetencia(e.target.value + '-01')} className="border rounded-lg px-3 py-2" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi title="Devido" v={resumo?.kpis.totalDevido ?? 0} />
        <Kpi title="Recebido" v={resumo?.kpis.totalRecebido ?? 0} />
        <KpiRaw title="Status" value={resumo?.kpis.inadimplentes ? 'Inadimplente' : 'OK'} />
        <KpiRaw title="% Inadimplência" value={`${resumo?.kpis.inadimplenciaPct ?? 0}%`} />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr><Th>Valor</Th><Th>Status</Th><Th>Dias atraso</Th><Th>Ações</Th></tr>
          </thead>
          <tbody>
            {(resumo?.pendencias ?? []).map(p => (
              <tr key={p.id} className="border-t">
                <Td>{currency(p.valor)}</Td>
                <Td><Badge status={p.status} /></Td>
                <Td>{p.diasAtraso}</Td>
                <Td>
                  <button
                    onClick={() => pagar(p.id)}
                    disabled={registrando === p.id || p.status !== 'PENDENTE' && p.status !== 'ATRASADO'}
                    className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:opacity-90 disabled:opacity-40"
                  >
                    {registrando === p.id ? 'Registrando…' : 'Registrar pagamento'}
                  </button>
                </Td>
              </tr>
            ))}
            {(!resumo || resumo.pendencias.length === 0) && (
              <tr><Td colSpan={4} className="text-center text-muted-foreground py-6">{loading ? 'Carregando…' : 'Sem pendências'}</Td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function defaultCompetencia(){ const d=new Date(); const y=d.getUTCFullYear(); const m=String(d.getUTCMonth()+1).padStart(2,'0'); return `${y}-${m}-01` }
function Th({children}:{children:React.ReactNode}){ return <th className="text-left px-4 py-3 font-medium">{children}</th> }
function Td({children, colSpan, className}:{children:React.ReactNode; colSpan?:number; className?:string}){ return <td className={`px-4 py-3 ${className??''}`} colSpan={colSpan}>{children}</td> }
function Badge({status}:{status:'PENDENTE'|'ATRASADO'|'PAGO'|'CANCELADO'}){ const m={PENDENTE:'bg-amber-100 text-amber-800', ATRASADO:'bg-red-100 text-red-800', PAGO:'bg-emerald-100 text-emerald-800', CANCELADO:'bg-zinc-100 text-zinc-800'} as const; return <span className={`px-2 py-1 rounded-md text-xs ${m[status]}`}>{status}</span> }
function Kpi({title, v}:{title:string; v:number}){ return <div className="rounded-2xl border p-4 shadow-sm bg-card"><div className="text-xs text-muted-foreground">{title}</div><div className="text-2xl mt-1 font-semibold">{currency(v)}</div></div> }
function KpiRaw({title, value}:{title:string; value:string}){ return <div className="rounded-2xl border p-4 shadow-sm bg-card"><div className="text-xs text-muted-foreground">{title}</div><div className="text-2xl mt-1 font-semibold">{value}</div></div> }
const currency = (n:number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n)
