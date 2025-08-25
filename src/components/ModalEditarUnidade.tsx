// src/components/ModalEditarUnidade.tsx
'use client'

import { useState } from 'react'

import type { UnidadeDTO, UnidadeUpdateInput } from '@/types/unidade'

interface ModalEditarUnidadeProps {
  unidade: UnidadeDTO
  onClose: () => void
  onSave: (unidadeAtualizada: UnidadeUpdateInput) => Promise<void>
}

export default function ModalEditarUnidade({ unidade, onClose, onSave }: ModalEditarUnidadeProps) {
  const [formData, setFormData] = useState({
    numero: unidade.numero,
    tipo: unidade.tipo,
    metragem: unidade.metragem?.toString() || '',
    fracaoIdeal: unidade.fracaoIdeal?.toString() || '',
    valorTaxa: unidade.valorTaxa.toString(),
    status: unidade.status
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const unidadeAtualizada = {
        numero: formData.numero,
        tipo: formData.tipo,
        metragem: formData.metragem ? parseFloat(formData.metragem) : null,
        fracaoIdeal: formData.fracaoIdeal ? parseFloat(formData.fracaoIdeal) : null,
        valorTaxa: parseFloat(formData.valorTaxa),
        status: formData.status
      }

      await onSave(unidadeAtualizada)
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
            Editar Unidade {unidade.numero}
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
              onChange={(e) => setFormData({...formData, tipo: e.target.value as 'apartamento' | 'cobertura' | 'loja' | 'garagem'})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              required
            >
              <option value="apartamento">Apartamento</option>
              <option value="cobertura">Cobertura</option>
              <option value="loja">Loja</option>
              <option value="garagem">Garagem</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Metragem (m²)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.metragem}
              onChange={(e) => setFormData({...formData, metragem: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              placeholder="Ex: 65.50"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Fração Ideal (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.fracaoIdeal}
              onChange={(e) => setFormData({...formData, fracaoIdeal: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              placeholder="Ex: 1.25"
              min="0"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Valor da Taxa (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.valorTaxa}
              onChange={(e) => setFormData({...formData, valorTaxa: e.target.value})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              placeholder="Ex: 250.00"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as 'ocupado' | 'vazio'})}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              required
            >
              <option value="ocupado">Ocupado</option>
              <option value="vazio">Vazio</option>
            </select>
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