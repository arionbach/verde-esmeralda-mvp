// src/components/ResponsavelForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ResponsavelCreateInput } from '@/app/api/_schemas'

interface Props {
  unidadeId: string
  predioId: string
  onSuccess?: () => void
}

export default function ResponsavelForm({ unidadeId, predioId, onSuccess }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<ResponsavelCreateInput>>({ tipo: 'PROPRIETARIO', ativo: true })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/predios/${predioId}/unidades/${unidadeId}/responsaveis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Erro ao salvar responsável')
      if (onSuccess) onSuccess()
      else router.push('..')
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  function updateField(key: keyof ResponsavelCreateInput, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border shadow-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome completo *</label>
        <input type="text" required value={form.nome || ''} onChange={e => updateField('nome', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">CPF ou CNPJ *</label>
        <input type="text" required value={form.cpfCnpj || ''} onChange={e => updateField('cpfCnpj', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Telefone</label>
          <input type="text" value={form.telefone || ''} onChange={e => updateField('telefone', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Whatsapp</label>
          <input type="text" value={form.whatsapp || ''} onChange={e => updateField('whatsapp', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" value={form.email || ''} onChange={e => updateField('email', e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipo</label>
          <select value={form.tipo || 'PROPRIETARIO'} onChange={e => updateField('tipo', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2">
            <option value="PROPRIETARIO">Proprietário</option>
            <option value="INQUILINO">Inquilino</option>
          </select>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input type="checkbox" id="ehTitularCobranca" checked={form.ehTitularCobranca || false}
            onChange={e => updateField('ehTitularCobranca', e.target.checked)} />
          <label htmlFor="ehTitularCobranca" className="text-sm text-gray-700">Titular de cobrança</label>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 rounded-lg bg-verde-esmeralda-600 text-white hover:bg-verde-esmeralda-700 disabled:opacity-50">
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
