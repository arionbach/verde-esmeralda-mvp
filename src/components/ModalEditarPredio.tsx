// src/components/ModalEditarPredio.tsx
'use client'

import { useState } from 'react'

interface Predio {
  id: string
  nome: string
  endereco: string
  totalUnidades: number | null
  valorTaxa: number | null
  observacoes: string | null
}

interface ModalEditarPredioProps {
  predio: Predio
  onClose: () => void
  onUpdate: () => void
}

export default function ModalEditarPredio({ predio, onClose, onUpdate }: ModalEditarPredioProps) {
  const [formData, setFormData] = useState({
    nome: predio.nome,
    endereco: predio.endereco,
    totalUnidades: predio.totalUnidades?.toString() || '',
    valorTaxa: predio.valorTaxa?.toString() || '',
    observacoes: predio.observacoes || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/predios/${predio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onUpdate()
        onClose()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao atualizar prédio')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao atualizar prédio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-verde-esmeralda-800">
            Editar Prédio
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
              Nome do Prédio *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              required
              placeholder="Ex: Edifício Central"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Endereço *
            </label>
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              required
              placeholder="Rua, número, bairro, cidade"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Total de Unidades
              </label>
              <input
                type="number"
                value={formData.totalUnidades}
                onChange={(e) => setFormData({...formData, totalUnidades: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
                placeholder="Ex: 24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Valor Taxa Mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valorTaxa}
                onChange={(e) => setFormData({...formData, valorTaxa: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
                placeholder="Ex: 150.00"
              />
            </div>
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
              placeholder="Observações sobre o prédio..."
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