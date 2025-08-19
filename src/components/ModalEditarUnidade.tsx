// src/components/ModalEditarUnidade.tsx
'use client'

import { useState } from 'react'

interface Unidade {
  id: string
  numero: string
  tipo: string
  area: number | null
  observacoes: string | null
}

interface ModalEditarUnidadeProps {
  unidade: Unidade
  onClose: () => void
  onUpdate: () => void
}

export default function ModalEditarUnidade({ unidade, onClose, onUpdate }: ModalEditarUnidadeProps) {
  const [formData, setFormData] = useState({
    numero: unidade.numero,
    tipo: unidade.tipo,
    area: unidade.area?.toString() || '',
    observacoes: unidade.observacoes || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/unidades/${unidade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onUpdate()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao atualizar unidade')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar unidade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-verde-esmeralda-800">
            Editar Unidade
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Número da Unidade *
            </label>
            <input
              type="text"
              value={formData.numero}
              onChange={(e) => setFormData({...formData, numero: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tipo *
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              required
            >
              <option value="APARTAMENTO">Apartamento</option>
              <option value="COBERTURA">Cobertura</option>
              <option value="LOJA">Loja</option>
              <option value="GARAGEM">Garagem</option>
              <option value="DEPOSITO">Depósito</option>
              <option value="OUTRO">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Área (m²)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.area}
              onChange={(e) => setFormData({...formData, area: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              placeholder="Ex: 65.50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Observações
            </label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              rows={3}
              placeholder="Observações sobre a unidade..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-verde-esmeralda-600 text-white rounded-lg hover:bg-verde-esmeralda-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}