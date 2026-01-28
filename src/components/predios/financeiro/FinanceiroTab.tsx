"use client"

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import RelatorioMensal from '@/components/predios/financeiro/RelatorioMensal'

type Props = {
  predioId: string
}

type ConsolidacaoFinanceiraPredio = {
  competencia: string | Date
  receitaPrevista: number
  receitaRealizada: number
  receitaEmAberto: number
  receitaAtrasada: number
}

type CompetenciaStatus = 'ABERTA' | 'FECHADA' | 'DESCONHECIDA'

function fmtBRL(n: number) {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)
  } catch {
    return `R$ ${Number(n ?? 0).toFixed(2)}`
  }
}

export default function FinanceiroTab({ predioId }: Props) {
  const search = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
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
  const [data, setData] = useState<ConsolidacaoFinanceiraPredio | null>(null)
  const [statusComp, setStatusComp] = useState<CompetenciaStatus>('DESCONHECIDA')
  const [execLoading, setExecLoading] = useState(false)
  const [execMsg, setExecMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/predios/${predioId}/financeiro/consolidado?competencia=${encodeURIComponent(competencia)}`)
        if (!res.ok) throw new Error('Falha ao carregar consolidação financeira')
        const json = (await res.json()) as ConsolidacaoFinanceiraPredio
        if (!cancelled) setData(json)
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Erro inesperado')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [predioId, competencia])

  useEffect(() => {
    let cancelled = false
    async function checkStatus() {
      try {
        setStatusComp('DESCONHECIDA')
        const res = await fetch(`/api/predios/${predioId}/financeiro/competencia/status?competencia=${encodeURIComponent(competencia)}`)
        if (!res.ok) throw new Error()
        const j = await res.json()
        if (!cancelled) setStatusComp(j?.status === 'FECHADA' ? 'FECHADA' : 'ABERTA')
      } catch {
        if (!cancelled) setStatusComp('DESCONHECIDA')
      }
    }
    checkStatus()
    return () => {
      cancelled = true
    }
  }, [predioId, competencia])

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Carregando consolidação financeira…</div>
    )
  }
  if (error) {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded">{error}</div>
    )
  }

  function onCompetenciaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = (e.target.value || '').slice(0, 7)
    const params = new URLSearchParams(search.toString())
    if (value) params.set('competencia', value)
    else params.delete('competencia')
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  async function onGerarClick() {
    setExecMsg(null)
    const okGo = window.confirm('Confirmar geração de Pagamento(TAXA_MENSAL) para a competência selecionada?')
    if (!okGo) return
    try {
      setExecLoading(true)
      const res = await fetch(`/api/predios/${predioId}/financeiro/gerar-mensal?competencia=${encodeURIComponent(competencia)}`, { method: 'POST' })
      const j = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = (j && j.error) || 'Falha ao gerar cobranças do mês'
        if (String(msg).toLowerCase().includes('fechad')) {
          setExecMsg('Competência fechada. Abra a competência antes de gerar cobranças.')
        } else {
          setExecMsg(msg)
        }
        return
      }
      setExecMsg(`Geração concluída: criadas ${j?.created ?? 0}, ignoradas ${j?.skipped ?? 0}, total de unidades ${j?.totalUnidades ?? 0}.`)
    } catch {
      setExecMsg('Erro inesperado ao gerar cobranças do mês')
    } finally {
      setExecLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label htmlFor="competencia" className="text-sm text-gray-600">
          Competência (YYYY-MM)
        </label>
        <input
          id="competencia"
          type="month"
          value={competencia}
          onChange={onCompetenciaChange}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        />
        <span className="ml-2 text-xs px-2 py-1 rounded-full border"
          title="Status da competência">
          {statusComp === 'DESCONHECIDA' ? 'status...' : statusComp}
        </span>
        <button
          onClick={onGerarClick}
          disabled={statusComp === 'FECHADA' || execLoading}
          className={`ml-auto px-3 py-2 rounded text-sm ${statusComp === 'FECHADA' || execLoading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-verde-esmeralda-600 text-white hover:bg-verde-esmeralda-700'}`}
        >
          {execLoading ? 'Gerando...' : 'Gerar cobranças do mês'}
        </button>
      </div>
      <div className="text-xs text-gray-500">
        <p>Esta ação gera Pagamento(TAXA_MENSAL) para a competência selecionada.</p>
        <p>Após o fechamento da competência, nenhuma alteração será permitida.</p>
      </div>
      {/* KPIs renderizados via RelatorioMensal para evitar duplicidade visual */}

      <div className="pt-2">
        <RelatorioMensal predioId={predioId} />
      </div>
      {/* Seção: Fechamento da Competência */}
      <FechamentoSection
        predioId={predioId}
        competencia={competencia}
        statusComp={statusComp}
        setStatusComp={setStatusComp}
      />

      {execMsg && (
        <div className="text-sm mt-2 p-3 rounded border bg-white">{execMsg}</div>
      )}
    </div>
  )
}


