// src/app/predios/[predioId]/unidades/[unidadeId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Unidade {
  id: string
  numero: string
  tipo: string
  status: string
  metragem: number | null
  fracaoIdeal: number | null
  valorTaxa: number
}

export default function EditarUnidadePage() {
  const { id: predioId, unidadeId } = useParams() as { id: string, unidadeId: string }
  const router = useRouter()

  const [unidade, setUnidade] = useState<Unidade | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/predios/${predioId}/unidades/${unidadeId}`)
      if (!res.ok) return setError('Erro ao carregar unidade')
      const data = await res.json()
      setUnidade(data)
    }

    fetchData()
  }, [predioId, unidadeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const formData = new FormData(e.target as HTMLFormElement)
    const body = {
      numero: formData.get('numero'),
      tipo: formData.get('tipo'),
      status: formData.get('status'),
      metragem: Number(formData.get('metragem')),
      fracaoIdeal: Number(formData.get('fracaoIdeal')),
      valorTaxa: Number(formData.get('valorTaxa')),
    }

    const res = await fetch(`/api/predios/${predioId}/unidades/${unidadeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      return setError(err?.message || 'Erro ao salvar')
    }

    router.push(`/predios/${predioId}?tab=unidades`)
  }

  if (!unidade) return <div className="p-6 text-gray-600">Carregando…</div>

  return (
    <main className="p-6 bg-verde-esmeralda-50 min-h-screen">
      <Link href={`/predios/${predioId}`} className="text-verde-esmeralda-600 hover:underline text-sm">← Voltar</Link>

      <form 
        onSubmit={handleSubmit} 
        className="bg-white mt-6 p-6 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl"
      >
        <h2 className="col-span-full text-2xl font-bold text-verde-esmeralda-800">
          Editar Unidade {unidade.numero}
        </h2>

        {error && (
          <div className="col-span-full p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <Input label="Número" name="numero" defaultValue={unidade.numero} required />
        <Select label="Tipo" name="tipo" defaultValue={unidade.tipo} options={['apartamento', 'cobertura', 'loja', 'garagem']} required />

        <Select label="Status" name="status" defaultValue={unidade.status} options={['ocupado', 'vazio']} required />
        <Input label="Metragem (m²)" name="metragem" type="number" step="0.01" defaultValue={unidade.metragem ?? ''} />

        <Input label="Fração Ideal (%)" name="fracaoIdeal" type="number" step="0.01" defaultValue={unidade.fracaoIdeal ?? ''} />
        <Input label="Valor da Taxa (R$)" name="valorTaxa" type="number" step="0.01" defaultValue={unidade.valorTaxa ?? 0} />

        <div className="col-span-full mt-4">
          <button 
            type="submit" 
            className="px-6 py-2 rounded-lg bg-verde-esmeralda-600 text-white hover:bg-verde-esmeralda-700 font-medium text-sm"
            disabled={saving}
          >
            {saving ? 'Salvando…' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </main>
  )
}

function Input({
  label,
  name,
  type = 'text',
  defaultValue,
  step,
  required = false
}: {
  label: string
  name: string
  type?: string
  defaultValue?: any
  step?: string
  required?: boolean
}) {
  return (
    <label className="flex flex-col text-sm text-gray-700 font-medium">
      {label}:
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        step={step}
        required={required}
        className="mt-1 rounded-lg border border-gray-300 px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
      />
    </label>
  )
}

function Select({
  label,
  name,
  defaultValue,
  options,
  required = false
}: {
  label: string
  name: string
  defaultValue?: string
  options: string[]
  required?: boolean
}) {
  return (
    <label className="flex flex-col text-sm text-gray-700 font-medium">
      {label}:
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 rounded-lg border border-gray-300 px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
    </label>
  )
}
