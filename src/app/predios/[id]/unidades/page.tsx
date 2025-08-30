// src/app/predios/[id]/unidades/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getUnidadeTipoLabel, getResponsavelTipoLabel } from '@/domain/unidades'
import ModalEditarUnidade from '@/components/ModalEditarUnidade'
import ModalConfirmarExclusao from '@/components/ModalConfirmarExclusao'

/* ================== Tipos ================== */
interface Predio {
  id: string
  nome: string
  endereco: string
  quantidadeUnidades: number
  nomeSindico: string | null
  telefoneSindico: string | null
  emailSindico: string | null
}

interface Responsavel {
  id: string
  nome: string
  cpfCnpj: string
  telefone: string | null
  email: string | null
  tipo: 'proprietario' | 'inquilino'
  dataInicio: string
  dataFim?: string
  ativo: boolean
}

interface Unidade {
  id: string
  numero: string
  tipo: 'apartamento' | 'cobertura' | 'loja' | 'garagem'
  metragem: number | null
  fracaoIdeal: number | null
  valorTaxa: number
  status: 'ocupado' | 'vazio'
  predioId: string
  responsaveis: Responsavel[]
  createdAt: string
  updatedAt: string
}

interface NovaUnidade {
  numero: string
  tipo: Unidade['tipo']
  metragem: number | null
  fracaoIdeal: number | null
  valorTaxa: number
  status: Unidade['status']
}

/* ================== Página ================== */
export default function UnidadesPage() {
  const { id: predioId } = useParams() as { id: string }

  const [predio, setPredio] = useState<Predio | null>(null)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null)
  const [deletingUnidade, setDeletingUnidade] = useState<Unidade | null>(null)

  const [novaUnidade, setNovaUnidade] = useState<NovaUnidade>({
    numero: '',
    tipo: 'apartamento',
    metragem: null,
    fracaoIdeal: null,
    valorTaxa: 0,
    status: 'vazio',
  })

  /* --------- Carregamento --------- */
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const p = await fetch(`/api/predios/${predioId}`)
        if (p.ok) setPredio(await p.json())

        const u = await fetch(`/api/predios/${predioId}/unidades`)
        if (u.ok) setUnidades(await u.json())
      } finally {
        setLoading(false)
      }
    }
    if (predioId) load()
  }, [predioId])

  /* --------- Helpers --------- */
  const totalUnidades = useMemo(() => predio?.quantidadeUnidades ?? 0, [predio])
  const ocupadas = useMemo(
    () =>
      unidades.filter(
        (u) => u.status === 'ocupado' || u.responsaveis?.some((r) => r.ativo)
      ).length,
    [unidades]
  )
  const ocupacaoPercent =
    unidades.length > 0 ? Math.round((ocupadas / unidades.length) * 100) : 0

  const getRespAtivo = (rs: Responsavel[]) => rs.find((r) => r.ativo) || rs[0] || null
  const getTipoLabel = (t: Unidade['tipo']) => getUnidadeTipoLabel(t)

  /* --------- Ações CRUD --------- */
  const fetchUnidades = async () => {
    const res = await fetch(`/api/predios/${predioId}/unidades`)
    if (res.ok) setUnidades(await res.json())
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`/api/predios/${predioId}/unidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...novaUnidade, predioId }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Erro ao criar unidade')
      }
      setNovaUnidade({
        numero: '',
        tipo: 'apartamento',
        metragem: null,
        fracaoIdeal: null,
        valorTaxa: 0,
        status: 'vazio',
      })
      setShowForm(false)
      await fetchUnidades()
    } catch (e: any) {
      alert(e?.message || 'Erro ao criar unidade')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditSave = async (update: Partial<Unidade>) => {
    if (!editingUnidade) return
    const res = await fetch(
      `/api/predios/${predioId}/unidades/${editingUnidade.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error || 'Erro ao editar unidade')
    }
    await fetchUnidades()
    setEditingUnidade(null)
  }

  const confirmDelete = async () => {
    if (!deletingUnidade) return
    const res = await fetch(
      `/api/predios/${predioId}/unidades/${deletingUnidade.id}`,
      { method: 'DELETE' }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err?.error || 'Erro ao excluir unidade')
      return
    }
    setUnidades((lst) => lst.filter((u) => u.id !== deletingUnidade.id))
    setDeletingUnidade(null)
  }

  /* --------- UI --------- */
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-verde-esmeralda-50 to-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-verde-esmeralda-600">
          <span className="h-3 w-3 rounded-full bg-verde-esmeralda-400 animate-pulse" />
          Carregando…
        </div>
      </main>
    )
  }

  if (!predio) {
    return (
      <main className="min-h-screen bg-verde-esmeralda-50 p-6">
        <Link href="/predios" className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800">
          ← Voltar
        </Link>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Prédio não encontrado.
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-verde-esmeralda-50 to-white">
      {/* Topbar */}
      <div className="border-b border-verde-esmeralda-100/70 bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/" className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800">Home</Link>
              <span className="text-gray-300">/</span>
              <Link href="/predios" className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800">Prédios</Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-600">Unidades</span>
            </div>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight text-verde-esmeralda-800">
              {predio.nome}
            </h1>
            {predio.endereco && (
              <p className="text-sm text-gray-600">📍 {predio.endereco}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/predios/${predioId}`}
              className="rounded-xl border border-verde-esmeralda-200 px-4 py-2 text-sm font-medium text-verde-esmeralda-700 hover:bg-verde-esmeralda-50"
            >
              ← Dashboard do prédio
            </Link>
            <button
              onClick={() => setShowForm(true)}
              className="rounded-xl bg-verde-esmeralda-600 px-4 py-2 text-sm font-medium text-white hover:bg-verde-esmeralda-700 shadow-sm"
            >
              + Nova unidade
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Unidades previstas" value={totalUnidades} />
        <Kpi label="Cadastradas" value={unidades.length} />
        <Kpi label="Ocupadas" value={ocupadas} />
        <Kpi label="Ocupação" value={`${ocupacaoPercent}%`} hint="Considera status e responsável ativo" />
      </div>

      {/* Form Nova Unidade */}
      {showForm && (
        <div className="container mx-auto px-4">
          <section className="bg-white rounded-2xl border border-verde-esmeralda-100 shadow-sm p-6 mb-6">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-verde-esmeralda-900">
                Nova unidade
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Fechar formulário"
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Número *</label>
                <input
                  value={novaUnidade.numero}
                  onChange={(e) => setNovaUnidade({ ...novaUnidade, numero: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                  placeholder="Ex: 101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo *</label>
                <select
                  value={novaUnidade.tipo}
                  onChange={(e) =>
                    setNovaUnidade({ ...novaUnidade, tipo: e.target.value as Unidade['tipo'] })
                  }
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                >
                  <option value="apartamento">Apartamento</option>
                  <option value="cobertura">Cobertura</option>
                  <option value="loja">Loja</option>
                  <option value="garagem">Garagem</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Metragem (m²)</label>
                <input
                  type="number"
                  step="0.01"
                  value={novaUnidade.metragem ?? ''}
                  onChange={(e) =>
                    setNovaUnidade({
                      ...novaUnidade,
                      metragem: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                  placeholder="Ex: 65.50"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fração ideal (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={novaUnidade.fracaoIdeal ?? ''}
                  onChange={(e) =>
                    setNovaUnidade({
                      ...novaUnidade,
                      fracaoIdeal: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                  placeholder="Ex: 1.25"
                  min={0}
                  max={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Taxa mensal (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number.isFinite(novaUnidade.valorTaxa) ? novaUnidade.valorTaxa : 0}
                  onChange={(e) =>
                    setNovaUnidade({ ...novaUnidade, valorTaxa: parseFloat(e.target.value) || 0 })
                  }
                  required
                  min={0}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                  placeholder="Ex: 250.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={novaUnidade.status}
                  onChange={(e) =>
                    setNovaUnidade({ ...novaUnidade, status: e.target.value as Unidade['status'] })
                  }
                  required
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                >
                  <option value="vazio">Vazio</option>
                  <option value="ocupado">Ocupado</option>
                </select>
              </div>

              <div className="md:col-span-3 flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-verde-esmeralda-600 px-4 py-2 text-sm font-medium text-white hover:bg-verde-esmeralda-700 disabled:opacity-60"
                >
                  {submitting ? 'Criando…' : 'Criar unidade'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Lista de Unidades (Cards premium) */}
      <div className="container mx-auto px-4 pb-10">
        {unidades.length === 0 ? (
          <section className="bg-white rounded-2xl border border-dashed border-verde-esmeralda-200 p-10 text-center text-gray-600">
            Nenhuma unidade cadastrada.
            <div className="mt-3">
              <button
                onClick={() => setShowForm(true)}
                className="text-verde-esmeralda-700 hover:text-verde-esmeralda-800 font-medium"
              >
                Cadastrar primeira unidade →
              </button>
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {unidades.map((u) => {
              const resp = getRespAtivo(u.responsaveis)
              return (
                <article
                  key={u.id}
                  className="bg-white rounded-2xl shadow-sm border border-verde-esmeralda-100 hover:shadow-md transition"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-verde-esmeralda-900">
                          Unidade {u.numero}
                        </h3>
                        <div className="mt-1 text-sm text-gray-600">
                          {getTipoLabel(u.tipo)} •{' '}
                          {u.metragem ? `${u.metragem} m²` : '—'}
                        </div>
                      </div>
                      <span
                        className={
                          'px-3 py-1 rounded-full text-xs font-medium ' +
                          (u.status === 'ocupado'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700')
                        }
                      >
                        {u.status === 'ocupado' ? 'Ocupada' : 'Vazia'}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                      <div>
                        <span className="text-gray-500">Fração ideal:</span>{' '}
                        <span className="font-medium">
                          {u.fracaoIdeal ?? '—'}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Taxa mensal:</span>{' '}
                        <span className="font-medium">
                          R$ {u.valorTaxa.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {resp && (
                      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Responsável:</span>{' '}
                          {resp.nome} ({resp.tipo === 'proprietario' ? 'Proprietário' : 'Inquilino'})
                        </div>
                        <div className="text-xs text-gray-500">
                          {resp.telefone || '—'} • {resp.email || '—'}
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => setEditingUnidade(u)}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeletingUnidade(u)}
                        className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
                      >
                        Excluir
                      </button>
                      <Link
                        href={`/predios/${predioId}/unidades`}
                        className="ml-auto text-verde-esmeralda-700 hover:text-verde-esmeralda-800 text-sm font-medium"
                      >
                        Gerenciar →
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {/* Modais */}
      {editingUnidade && (
        <ModalEditarUnidade
          unidade={editingUnidade}
          onSave={handleEditSave}
          onClose={() => setEditingUnidade(null)}
        />
      )}

      {deletingUnidade && (
        <ModalConfirmarExclusao
          item={`Unidade ${deletingUnidade.numero}`}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingUnidade(null)}
        />
      )}
    </main>
  )
}

/* ================== Subcomponentes ================== */

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-2xl border border-verde-esmeralda-100 bg-white shadow-sm p-5">
      <div className="text-xs uppercase tracking-wide text-verde-esmeralda-600/80">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-verde-esmeralda-900">
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  )
}
