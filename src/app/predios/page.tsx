// src/app/predios/page.tsx - VERSÃO CORRIGIDA E FUNCIONAL
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Predio {
  id: string
  nome: string
  endereco: string
  quantidadeUnidades: number
  nomeSindico: string | null
  _count: {
    unidades: number
  }
}

export default function PrediosPage() {
  const [predios, setPredios] = useState<Predio[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPredios()
  }, [])

  const fetchPredios = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/predios')
      
      if (!response.ok) {
        throw new Error('Erro ao carregar prédios')
      }
      
      const data = await response.json()
      console.log('Dados recebidos:', data) // Debug
      
      setPredios(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar predios:', error)
      setError('Erro ao carregar prédios. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-verde-esmeralda-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-verde-esmeralda-600 text-lg">Carregando...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-verde-esmeralda-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={fetchPredios}
            className="bg-verde-esmeralda-600 text-white px-4 py-2 rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-verde-esmeralda-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link 
              href="/" 
              className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800 mb-2 inline-block"
            >
              ← Voltar
            </Link>
            <h1 className="text-3xl font-bold text-verde-esmeralda-800">
              Gestão de Prédios
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-verde-esmeralda-600 text-white px-6 py-2 rounded-lg hover:bg-verde-esmeralda-700 transition-colors"
          >
            + Novo Prédio
          </button>
        </div>

        {/* Conteúdo */}
        {predios.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Nenhum prédio cadastrado
            </h2>
            <p className="text-gray-500 mb-6">
              Comece cadastrando seu primeiro condomínio
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-verde-esmeralda-600 text-white px-6 py-2 rounded-lg hover:bg-verde-esmeralda-700 transition-colors"
            >
              Cadastrar Primeiro Prédio
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predios.map((predio) => (
              <div 
                key={predio.id} 
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <h3 className="text-xl font-semibold text-verde-esmeralda-800 mb-2">
                  {predio.nome}
                </h3>
                <p className="text-gray-600 mb-4">{predio.endereco}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unidades:</span>
                    <span className="font-semibold">{predio.quantidadeUnidades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cadastradas:</span>
                    <span className="font-semibold">{predio._count.unidades}</span>
                  </div>
                  {predio.nomeSindico && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Síndico:</span>
                      <span className="font-semibold">{predio.nomeSindico}</span>
                    </div>
                  )}
                </div>
                
                <Link
                  href={`/predios/${predio.id}`}
                  className="block w-full bg-verde-esmeralda-600 text-white text-center py-2 rounded-lg hover:bg-verde-esmeralda-700 transition-colors"
                >
                  Gerenciar
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Modal de formulário */}
        {showForm && (
          <FormularioPredio 
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false)
              fetchPredios()
            }}
          />
        )}
      </div>
    </div>
  )
}

function FormularioPredio({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    cnpj: '',
    quantidadeUnidades: '',
    dataFundacao: '',
    nomeSindico: '',
    telefoneSindico: '',
    emailSindico: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError(null)

  try {
    const response = await fetch('/api/predios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData) // 👈 aqui
    })

    if (response.ok) {
      onSuccess()
    } else {
      const errorData = await response.json().catch(() => ({}))
      setError(errorData.error || 'Erro ao cadastrar prédio')
    }
  } catch (error) {
    console.error('Erro:', error)
    setError('Erro ao cadastrar prédio')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-verde-esmeralda-800">
              Novo Prédio
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Condomínio *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
                  placeholder="Ex: Residencial Verde Mar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade de Unidades *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantidadeUnidades}
                  onChange={(e) => setFormData({...formData, quantidadeUnidades: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
                  placeholder="Ex: 50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço Completo *
              </label>
              <input
                type="text"
                required
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
                placeholder="Ex: Rua das Flores, 123 - Centro - São Paulo/SP"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Fundação
                </label>
                <input
                  type="date"
                  value={formData.dataFundacao}
                  onChange={(e) => setFormData({...formData, dataFundacao: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Dados do Síndico
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Síndico
                  </label>
                  <input
                    type="text"
                    value={formData.nomeSindico}
                    onChange={(e) => setFormData({...formData, nomeSindico: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefoneSindico}
                    onChange={(e) => setFormData({...formData, telefoneSindico: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.emailSindico}
                  onChange={(e) => setFormData({...formData, emailSindico: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
                  placeholder="sindico@email.com"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-verde-esmeralda-600 text-white rounded-lg hover:bg-verde-esmeralda-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Prédio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}