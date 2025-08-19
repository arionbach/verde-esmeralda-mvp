// src/app/predios/[id]/unidades/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ModalEditarUnidade from '@/components/ModalEditarUnidade'
import ModalConfirmarExclusao from '@/components/ModalConfirmarExclusao'

// ✅ Interface CORRIGIDA para bater com Schema Prisma
interface Predio {
  id: string
  nome: string
  endereco: string
  quantidadeUnidades: number
  nomeSindico: string | null    // ✅ Corrigido de 'sindico'
  telefoneSindico: string | null // ✅ Corrigido de 'telefone'
  emailSindico: string | null   // ✅ Corrigido de 'email'
}

// ✅ Interface CORRIGIDA para bater com Schema Prisma
interface Responsavel {
  id: string
  nome: string
  cpfCnpj: string              // ✅ Corrigido de 'cpf'
  telefone: string | null
  email: string | null
  tipo: 'proprietario' | 'inquilino'
  dataInicio: string
  dataFim?: string
  ativo: boolean
}

// ✅ Interface CORRIGIDA para bater com Schema Prisma
interface Unidade {
  id: string
  numero: string
  tipo: 'apartamento' | 'cobertura' | 'loja' | 'garagem'
  metragem: number | null      // ✅ Corrigido de 'area'
  fracaoIdeal: number | null
  valorTaxa: number
  status: 'ocupado' | 'vazio'
  predioId: string
  responsaveis: Responsavel[]
  createdAt: string
  updatedAt: string
}

// ✅ Interface CORRIGIDA - removido campo 'andar'
interface NovaUnidade {
  numero: string
  tipo: 'apartamento' | 'cobertura' | 'loja' | 'garagem'
  metragem: number | null
  fracaoIdeal: number | null
  valorTaxa: number
  status: 'ocupado' | 'vazio'
}

export default function UnidadesPage() {
  const params = useParams()
  const router = useRouter()
  const predioId = params.id as string

  const [predio, setPredio] = useState<Predio | null>(null)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUnidade, setEditingUnidade] = useState<Unidade | null>(null)
  const [deletingUnidade, setDeletingUnidade] = useState<Unidade | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [novaUnidade, setNovaUnidade] = useState<NovaUnidade>({
    numero: '',
    tipo: 'apartamento',
    metragem: null,
    fracaoIdeal: null,
    valorTaxa: 0,
    status: 'vazio'
  })

  // Função para obter responsável ativo
  const getResponsavelAtivo = (responsaveis: Responsavel[]) => {
    return responsaveis.find(r => r.ativo) || responsaveis[0] || null
  }

  useEffect(() => {
    if (predioId) {
      fetchPredio()
      fetchUnidades()
    }
  }, [predioId])

  const fetchPredio = async () => {
    try {
      const response = await fetch(`/api/predios/${predioId}`)
      if (response.ok) {
        const data = await response.json()
        setPredio(data)
      }
    } catch (error) {
      console.error('Erro ao buscar prédio:', error)
    }
  }

  const fetchUnidades = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/predios/${predioId}/unidades`)
      if (response.ok) {
        const data = await response.json()
        setUnidades(data)
      }
    } catch (error) {
      console.error('Erro ao buscar unidades:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/predios/${predioId}/unidades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...novaUnidade,
          predioId
        }),
      })

      if (response.ok) {
        const unidadeCriada = await response.json()
        setUnidades(prev => [...prev, unidadeCriada])
        setNovaUnidade({
          numero: '',
          tipo: 'apartamento',
          metragem: null,
          fracaoIdeal: null,
          valorTaxa: 0,
          status: 'vazio'
        })
        setShowForm(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar unidade')
      }
    } catch (error) {
      console.error('Erro ao criar unidade:', error)
      alert('Erro ao criar unidade')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (unidade: Unidade) => {
    setEditingUnidade(unidade)
  }

  const handleEditSave = async (unidadeAtualizada: Partial<Unidade>) => {
    if (!editingUnidade) return

    try {
      const response = await fetch(`/api/predios/${predioId}/unidades/${editingUnidade.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unidadeAtualizada),
      })

      if (response.ok) {
        const unidadeEditada = await response.json()
        setUnidades(prev => 
          prev.map(u => u.id === editingUnidade.id ? unidadeEditada : u)
        )
        setEditingUnidade(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao editar unidade')
      }
    } catch (error) {
      console.error('Erro ao editar unidade:', error)
      alert('Erro ao editar unidade')
    }
  }

  const handleDelete = (unidade: Unidade) => {
    setDeletingUnidade(unidade)
  }

  const confirmDelete = async () => {
    if (!deletingUnidade) return

    try {
      const response = await fetch(`/api/predios/${predioId}/unidades/${deletingUnidade.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setUnidades(prev => prev.filter(u => u.id !== deletingUnidade.id))
        setDeletingUnidade(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao excluir unidade')
      }
    } catch (error) {
      console.error('Erro ao excluir unidade:', error)
      alert('Erro ao excluir unidade')
    }
  }

  const resetForm = () => {
    setNovaUnidade({
      numero: '',
      tipo: 'apartamento',
      metragem: null,
      fracaoIdeal: null,
      valorTaxa: 0,
      status: 'vazio'
    })
    setShowForm(false)
  }

  if (!predio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-esmeralda-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href={`/predios/${predioId}`}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Voltar ao Dashboard
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Unidades - {predio.nome}
                </h1>
                <p className="text-sm text-gray-500">{predio.endereco}</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowForm(true)}
              className="bg-verde-esmeralda-600 text-white px-4 py-2 rounded-lg hover:bg-verde-esmeralda-700 transition-colors"
            >
              + Nova Unidade
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Formulário de Nova Unidade */}
        {showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Nova Unidade</h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={novaUnidade.numero}
                    onChange={(e) => setNovaUnidade({...novaUnidade, numero: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                    required
                    placeholder="Ex: 101, 102..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={novaUnidade.tipo}
                    onChange={(e) => setNovaUnidade({...novaUnidade, tipo: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                    required
                  >
                    <option value="apartamento">Apartamento</option>
                    <option value="cobertura">Cobertura</option>
                    <option value="loja">Loja</option>
                    <option value="garagem">Garagem</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metragem (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={novaUnidade.metragem || ''}
                    onChange={(e) => setNovaUnidade({...novaUnidade, metragem: e.target.value ? parseFloat(e.target.value) : null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                    min="0"
                    placeholder="Ex: 65.50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fração Ideal (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={novaUnidade.fracaoIdeal || ''}
                    onChange={(e) => setNovaUnidade({...novaUnidade, fracaoIdeal: e.target.value ? parseFloat(e.target.value) : null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                    min="0"
                    max="100"
                    placeholder="Ex: 1.25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor da Taxa (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={novaUnidade.valorTaxa || ''}
                    onChange={(e) => setNovaUnidade({...novaUnidade, valorTaxa: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                    required
                    min="0"
                    placeholder="Ex: 250.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={novaUnidade.status}
                    onChange={(e) => setNovaUnidade({...novaUnidade, status: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-verde-esmeralda-500"
                    required
                  >
                    <option value="vazio">Vazio</option>
                    <option value="ocupado">Ocupado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-verde-esmeralda-600 text-white px-6 py-2 rounded-lg hover:bg-verde-esmeralda-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Criando...' : 'Criar Unidade'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Unidades */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Unidades Cadastradas ({unidades.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-verde-esmeralda-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando unidades...</p>
            </div>
          ) : unidades.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Nenhuma unidade cadastrada ainda.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-verde-esmeralda-600 hover:text-verde-esmeralda-700"
              >
                Cadastrar primeira unidade →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {unidades.map((unidade) => {
                const responsavelAtivo = getResponsavelAtivo(unidade.responsaveis)
                
                return (
                  <div key={unidade.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-gray-900 text-lg">
                            Unidade {unidade.numero}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            unidade.status === 'ocupado' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {unidade.status === 'ocupado' ? 'Ocupada' : 'Vazia'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">Tipo:</span> {unidade.tipo}
                          </div>
                          <div>
                            <span className="font-medium">Metragem:</span> {unidade.metragem ? `${unidade.metragem}m²` : '—'}
                          </div>
                          <div>
                            <span className="font-medium">Fração Ideal:</span> {unidade.fracaoIdeal ? `${unidade.fracaoIdeal}%` : '—'}
                          </div>
                          <div>
                            <span className="font-medium">Taxa Mensal:</span> R$ {unidade.valorTaxa.toFixed(2)}
                          </div>
                        </div>
                        
                        {responsavelAtivo && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Responsável:</span> {responsavelAtivo.nome} ({responsavelAtivo.tipo})
                            <br />
                            <span className="font-medium">Contato:</span> {responsavelAtivo.telefone || '—'} | {responsavelAtivo.email || '—'}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(unidade)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(unidade)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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
    </div>
  )
}