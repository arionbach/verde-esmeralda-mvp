// src/app/predios/[id]/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'

type TabKey = 'unidades' | 'financeiro' | 'comunicados' | 'relatorios'

interface Predio {
  id: string
  nome: string
  endereco: string
  quantidadeUnidades?: number
  nomeSindico?: string | null
  _count?: { unidades: number }
}

interface Unidade {
  id: string
  numero: string
  bloco?: string | null
  status?: 'OCUPADA' | 'VAGA' | 'INADIMPLENTE' | string
  responsavel?: { nome: string } | null
}

export default function PredioDashboardPage() {
  const params = useParams() as { id: string }
  const search = useSearchParams()
  const [tab, setTab] = useState<TabKey>(() => (search.get('tab') as TabKey) || 'unidades')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [predio, setPredio] = useState<Predio | null>(null)
  const [unidades, setUnidades] = useState<Unidade[]>([])

  const totalUnidades = useMemo(() => predio?.quantidadeUnidades ?? unidades.length, [predio, unidades])
  const cadastradas = useMemo(() => predio?._count?.unidades ?? unidades.length, [predio, unidades])

  useEffect(() => setTab(((search.get('tab') as TabKey) || 'unidades')), [search])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const p = await fetch(`/api/predios/${params.id}`)
        if (p.ok) setPredio(await p.json())

        const u = await fetch(`/api/predios/${params.id}/unidades`)
        if (!u.ok) throw new Error('Falha ao carregar unidades')
        setUnidades(await u.json())
      } catch (e: any) {
        setError(e?.message ?? 'Erro inesperado')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  if (loading) {
    return <div className="min-h-screen bg-verde-esmeralda-50 flex items-center justify-center text-verde-esmeralda-600">Carregando…</div>
  }
  if (error) {
    return (
      <main className="min-h-screen bg-verde-esmeralda-50 p-6">
        <Link href="/predios" className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800">← Voltar</Link>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-verde-esmeralda-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 text-sm">
          <Link href="/" className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/predios" className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800">Prédios</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-700">{predio?.nome ?? 'Prédio'}</span>
        </div>

        <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-verde-esmeralda-800">{predio?.nome ?? 'Condomínio'}</h1>
            {predio?.endereco && <p className="text-sm text-gray-600">{predio.endereco}</p>}
            {predio?.nomeSindico && <p className="text-sm text-gray-500">Síndico: <span className="font-medium">{predio.nomeSindico}</span></p>}
          </div>
          <div className="flex gap-2">
            <Link href="/predios" className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Voltar</Link>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-verde-esmeralda-600 text-white hover:bg-verde-esmeralda-700">Atualizar</button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Unidades (previstas)" value={totalUnidades} />
          <KpiCard label="Unidades cadastradas" value={cadastradas} />
          <KpiCard label="Ocupação" value={`${calcOcupacao(unidades)}%`} />
          <KpiCard label="Inadimplência" value="—" hint="Conectar ao módulo financeiro" />
        </section>

        <Tabs tab={tab} onChange={setTab} />

        <div className="mt-6">
          {tab === 'unidades' && (
            <TabUnidades
              predioId={params.id}
              itens={unidades}
              onRefresh={async () => {
                setSaving(true)
                try {
                  const res = await fetch(`/api/predios/${params.id}/unidades`)
                  if (res.ok) setUnidades(await res.json())
                } finally {
                  setSaving(false)
                }
              }}
              loading={saving}
            />
          )}

          {tab === 'financeiro' && <Placeholder title="Financeiro" subtitle="Em breve: composição mensal, cobranças, pagamentos e relatórios." />}
          {tab === 'comunicados' && <Placeholder title="Comunicados" subtitle="Envio de avisos por unidade/condomínio, histórico e categorias." />}
          {tab === 'relatorios' && <Placeholder title="Relatórios" subtitle="Arrecadação, inadimplência, despesas e indicadores." />}
        </div>
      </div>
    </main>
  )
}

function Tabs({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  const items: { key: TabKey; label: string }[] = [
    { key: 'unidades', label: 'Unidades' },
    { key: 'financeiro', label: 'Financeiro' },
    { key: 'comunicados', label: 'Comunicados' },
    { key: 'relatorios', label: 'Relatórios' },
  ]
  return (
    <nav className="bg-white rounded-xl shadow-sm p-1 flex gap-1 w-full overflow-x-auto">
      {items.map(i => (
        <button
          key={i.key}
          onClick={() => onChange(i.key)}
          className={['px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors', tab === i.key ? 'bg-verde-esmeralda-600 text-white shadow' : 'text-gray-700 hover:bg-gray-50'].join(' ')}
        >
          {i.label}
        </button>
      ))}
    </nav>
  )
}

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-verde-esmeralda-800">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  )
}

function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-xl p-10 text-center border border-dashed border-gray-300">
      <div className="text-4xl mb-2">🛠️</div>
      <h2 className="text-xl font-semibold text-verde-esmeralda-800">{title}</h2>
      <p className="text-gray-600 mt-2">{subtitle}</p>
    </div>
  )
}

function TabUnidades({ predioId, itens, onRefresh, loading }: { predioId: string; itens: Unidade[]; onRefresh: () => Promise<void>; loading: boolean }) {
  return (
    <section className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-lg font-semibold text-verde-esmeralda-800">Unidades</h2>
        <div className="flex gap-2">
          <Link href={`/predios/${predioId}/unidades/nova`} className="px-4 py-2 rounded-lg bg-verde-esmeralda-600 text-white hover:bg-verde-esmeralda-700">+ Nova Unidade</Link>
          <button onClick={onRefresh} disabled={loading} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            {loading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
      </div>

      {itens.length === 0 ? (
        <div className="p-10 text-center text-gray-600 bg-gray-50 rounded-lg border border-dashed">Nenhuma unidade cadastrada.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Número</th>
                <th className="py-2 pr-4">Bloco</th>
                <th className="py-2 pr-4">Responsável</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {itens.map(u => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium text-gray-800">{u.numero}</td>
                  <td className="py-2 pr-4">{u.bloco ?? '—'}</td>
                  <td className="py-2 pr-4">{u.responsavel?.nome ?? '—'}</td>
                  <td className="py-2 pr-4"><StatusPill status={u.status} /></td>
                  <td className="py-2 pr-0 text-right">
                    <Link href={`/predios/${predioId}/unidades/${u.id}`} className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800">Gerenciar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function StatusPill({ status }: { status?: string }) {
  const map: Record<string, string> = {
    OCUPADA: 'bg-emerald-100 text-emerald-700',
    INADIMPLENTE: 'bg-orange-100 text-orange-700',
    VAGA: 'bg-gray-100 text-gray-700',
  }
  const cls = map[status || ''] || 'bg-gray-100 text-gray-700'
  const label = status || '—'
  return <span className={`px-2 py-1 rounded-full text-xs ${cls}`}>{label}</span>
}

// considera ocupada se status = OCUPADA ou se há responsável
function calcOcupacao(unidades: Unidade[]): number {
  if (!unidades?.length) return 0
  const ocupadas = unidades.filter(u => u.status === 'OCUPADA' || !!u.responsavel).length
  return Math.round((ocupadas / unidades.length) * 100)
}
