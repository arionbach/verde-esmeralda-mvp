// src/components/ModalEditarPredio.tsx
'use client'

import { useState } from 'react'

// ✅ Interface CORRIGIDA para bater com Schema Prisma
interface Predio {
  id: string
  nome: string
  endereco: string
  cnpj: string | null
  quantidadeUnidades: number
  dataFundacao: string | null
  nomeSindico: string | null      // ✅ Corrigido de 'sindico'
  telefoneSindico: string | null  // ✅ Corrigido de 'telefone'
  emailSindico: string | null     // ✅ Corrigido de 'email'
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
    cnpj: predio.cnpj || '',
    quantidadeUnidades: predio.quantidadeUnidades.toString(),
    dataFundacao: predio.dataFundacao ? predio.dataFundacao.split('T')[0] : '',
    nomeSindico: predio.nomeSindico || '',           // ✅ Corrigido
    telefoneSindico: predio.telefoneSindico || '',   // ✅ Corrigido
    emailSindico: predio.emailSindico || ''          // ✅ Corrigido
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
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                CNPJ
              </label>
              <input
                type="text"
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
                placeholder="00.000.000/0000-00"
              />
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Quantidade de Unidades
              </label>
              <input
                type="number"
                value={formData.quantidadeUnidades}
                onChange={(e) => setFormData({...formData, quantidadeUnidades: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
                placeholder="Ex: 24"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Data de Fundação
              </label>
              <input
                type="date"
                value={formData.dataFundacao}
                onChange={(e) => setFormData({...formData, dataFundacao: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-verde-esmeralda-800 mb-3">
              Dados do Síndico
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nome do Síndico
                </label>
                <input
                  type="text"
                  value={formData.nomeSindico}
                  onChange={(e) => setFormData({...formData, nomeSindico: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Telefone do Síndico
                </label>
                <input
                  type="tel"
                  value={formData.telefoneSindico}
                  onChange={(e) => setFormData({...formData, telefoneSindico: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Email do Síndico
              </label>
              <input
                type="email"
                value={formData.emailSindico}
                onChange={(e) => setFormData({...formData, emailSindico: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
                placeholder="sindico@exemplo.com"
              />
            </div>
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