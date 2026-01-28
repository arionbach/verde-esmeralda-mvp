"use client"

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Props = { predioId: string }

type RelatorioMensalDTO = {
  competencia: string | Date
  receitaPrevista: number
  receitaRealizada: number
  receitaEmAberto: number
  receitaAtrasada: number
  percentualInadimplencia: number
}

function fmtBRL(n: number) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)
  } catch {
    return `R$ ${Number(n ?? 0).toFixed(2)}`
  }
}

function fmtPct(n: number) {
  const v = Number.isFinite(n) ? n : 0
  return `${(v * 100).toFixed(1)}%`
}

export default function RelatorioMensal({ predioId }: Props) {
  const search = useSearchParams()
  const competencia = useMemo(() => {
    const q = search.get('competencia')
    if (q && q.length >= 7) return q.slice(0, 7)
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }, [search])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<RelatorioMensalDTO | null>(null)

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/predios/${predioId}/financeiro/relatorio-mensal?competencia=${encodeURIComponent(competencia)}`)
        if (!res.ok) throw new Error('Falha ao carregar relatório financeiro mensal')
        const json = (await res.json()) as RelatorioMensalDTO
        if (!cancel) setData(json)
      } catch (e: any) {
        if (!cancel) setError(e?.message ?? 'Erro inesperado')
      } finally {
        if (!cancel) setLoading(false)
      }
    }
    load()
    return () => {
      cancel = true
    }
  }, [predioId, competencia])

  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Carregando relatório…</div>
  }
  if (error) {
    return <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{error}</div>
  }

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card label="Receita Prevista" value={fmtBRL(data?.receitaPrevista ?? 0)} />
      <Card label="Receita Realizada" value={fmtBRL(data?.receitaRealizada ?? 0)} />
      <Card label="Em Aberto" value={fmtBRL(data?.receitaEmAberto ?? 0)} />
      <Card label="Atrasada" value={fmtBRL(data?.receitaAtrasada ?? 0)} />
      <Card label="Inadimplência" value={fmtPct(data?.percentualInadimplencia ?? 0)} />
    </section>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-verde-esmeralda-800">{value}</div>
    </div>
  )
}

