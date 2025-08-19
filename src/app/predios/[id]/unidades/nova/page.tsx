'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

// helpers
function toNumberSafe(value: string) {
  if (!value) return undefined
  // aceita vírgula como decimal
  const v = value.replace(/\./g, '').replace(',', '.')
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

type FormState = {
  numero: string
  tipo: 'apartamento' | 'cobertura' | 'loja' | 'garagem'
  metragem: string
  fracaoIdeal: string
  status: 'ocupado' | 'vazio'
  valorTaxa: string
}

export default function NovaUnidadePage() {
  const params = useParams() as { id: string }
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    numero: '',
    tipo: 'apartamento',
    metragem: '',
    fracaoIdeal: '',
    status: 'ocupado',
    valorTaxa: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // validações mínimas no cliente
    if (!form.numero.trim()) {
      setError('Informe o número da unidade.')
      return
    }

    const payload = {
      numero: form.numero.trim(),
      tipo: form.tipo,
      metragem: toNumberSafe(form.metragem),
      fracaoIdeal: toNumberSafe(form.fracaoIdeal),
      status: form.status,
      valorTaxa: toNumberSafe(form.valorTaxa) ?? 0,
    }

    try {
      setSubmitting(true)
      const res = await fetch(`/api/predios/${params.id}/unidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 409) {
        setError('Já existe uma unidade com este número neste prédio.')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? 'Falha ao salvar unidade.')
        return
      }

      // sucesso → volta para o prédio na aba Unidades
      router.push(`/predios/${params.id}?tab=unidades`)
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? 'Erro inesperado ao salvar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-verde-esmeralda-50">
      <div className="container mx-auto px-4 py-6">
        {/* breadcrumb */}
        <div className="mb-4 text-sm">
          <Link href="/" className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/predios" className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800">Prédios</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href={`/predios/${params.id}?tab=unidades`} className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800">Detalhes</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-700">Nova Unidade</span>
        </div>

        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-verde-esmeralda-800">Nova Unidade</h1>
            <Link
              href={`/predios/${params.id}?tab=unidades`}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Número */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Número *</label>
              <input
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="Ex: 101"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                required
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo *</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as FormState['tipo'] })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="apartamento">Apartamento</option>
                <option value="cobertura">Cobertura</option>
                <option value="loja">Loja</option>
                <option value="garagem">Garagem</option>
              </select>
            </div>

            {/* Metragem */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Metragem (m²)</label>
              <input
                inputMode="decimal"
                value={form.metragem}
                onChange={(e) => setForm({ ...form, metragem: e.target.value })}
                placeholder="Ex: 65"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Fração ideal */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fração ideal</label>
              <input
                inputMode="decimal"
                value={form.fracaoIdeal}
                onChange={(e) => setForm({ ...form, fracaoIdeal: e.target.value })}
                placeholder="Ex: 0.0205"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status *</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as FormState['status'] })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="ocupado">Ocupado</option>
                <option value="vazio">Vazio</option>
              </select>
            </div>

            {/* Valor da taxa */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Valor da taxa (R$)</label>
              <input
                inputMode="decimal"
                value={form.valorTaxa}
                onChange={(e) => setForm({ ...form, valorTaxa: e.target.value })}
                placeholder="Ex: 350"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            {/* Ações */}
            <div className="col-span-1 md:col-span-2 flex gap-2 mt-2">
              <Link
                href={`/predios/${params.id}?tab=unidades`}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Voltar
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-verde-esmeralda-600 text-white hover:bg-verde-esmeralda-700 disabled:opacity-60"
              >
                {submitting ? 'Salvando…' : 'Salvar Unidade'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
