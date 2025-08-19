// src/app/predios/[id]/unidades/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ModalEditarUnidade from '@/components/ModalEditarUnidade'
import ModalConfirmarExclusao from '@/components/ModalConfirmarExclusao'

interface Responsavel {
  id: string
  nome: string
  tipo: string
  telefone: string | null
  email: string | null
}

interface Unidade {
  id: string
  numero: string
  tipo: string
  area: number | null
  observacoes: string | null
  responsavel: Responsavel | null
}

interface Predio {
  id: string
  nome: string
  endereco: string
}

export default function UnidadesPage() {
  const params = useParams()
  const router = useRouter()
  const predioId = params.id as string

  const [predio, setPredio] = useState<Predio | null>(null)
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [novaUnidade, setNovaUnidade] = useState({
    numero: '',
    tipo: 'APARTAMENTO',
    area: '',
    observacoes: ''
  })
  const [showForm, setShowForm] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Estados para modais
  const [unidadeEditando, setUnidadeEditando] = useState<Unidade | null>(null)
  const [unidadeExcluindo, setUnidadeExcluindo] = useState<Unidade | null>(null)

  const carregarDados = async () => {
    try {
      // Carregar dados do prédio
      const predioResponse = await fetch(`/api/predios/${predioId}`)
      if (predioResponse.ok) {
        const predioData = await predioResponse.json()
        setPredio(predioData)
      }

      // Carregar unidades
      const unidadesResponse = await fetch(`/api/predios/${predioId}/unidades`)
      if (unidadesResponse.ok) {
        const unidadesData = await unidadesResponse.json()
        setUnidades(unidadesData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [predioId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)

    try {
      const response = await fetch(`/api/predios/${predioId}/unidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaUnidade)
      })

      if (response.ok) {
        setNovaUnidade({ numero: '', tipo: 'APARTAMENTO', area: '', observacoes: '' })
        setShowForm(false)
        carregarDados()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar unidade')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao criar unidade')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleExcluirUnidade = async () => {
    if (!unidadeExcluindo) return

    try {
      const response = await fetch(`/api/unidades/${unidadeExcluindo.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUnidadeExcluindo(null)
        carregarDados()
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao excluir unidade')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao excluir unidade')
    }
  }

  const getTipoLabel = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      'APARTAMENTO': 'Apartamento',
      'COBERTURA': 'Cobertura',
      'LOJA': 'Loja',
      'GARAGEM': 'Garagem',
      'DEPOSITO': 'Depósito',
      'OUTRO': 'Outro'
    }
    return tipos[tipo] || tipo
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-verde-esmeralda-50 to-verde-esmeralda-100 p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-verde-esmeralda-600">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-verde-esmeralda-50 to-verde-esmeralda-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-verde-esmeralda-600 mb-2">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link href="/" className="hover:underline">Prédios</Link>
            <span>/</span>
            <span>{predio?.nome}</span>
            <span>/</span>
            <span>Unidades</span>
          </div>
          <h1 className="text-3xl font-bold text-verde-esmeralda-800">
            Unidades - {predio?.nome}
          </h1>
          <p className="text-verde-esmeralda-600 mt-1">{predio?.endereco}</p>
        </div>

        {/* Botão Adicionar */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-verde-esmeralda-600 text-white px-4 py-2 rounded-lg hover:bg-verde-esmeralda-700 transition-colors"
          >
            {showForm ? '✕ Cancelar' : '+ Nova Unidade'}
          </button>
        </div>

        {/* Formulário */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-verde-esmeralda-800 mb-4">
              Nova Unidade
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Número da Unidade *
                </label>
                <input
                  type="text"
                  value={novaUnidade.numero}
                  onChange={(e) => setNovaUnidade({...novaUnidade, numero: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
                  required
                  placeholder="Ex: 101, A1, Loja 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo *
                </label>
                <select
                  value={novaUnidade.tipo}
                  onChange={(e) => setNovaUnidade({...novaUnidade, tipo: e.target.value})}
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
                  value={novaUnidade.area}
                  onChange={(e) => setNovaUnidade({...novaUnidade, area: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
                  placeholder="Ex: 65.50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  value={novaUnidade.observacoes}
                  onChange={(e) => setNovaUnidade({...novaUnidade, observacoes: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500"
                  placeholder="Observações sobre a unidade"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-verde-esmeralda-600 text-white px-6 py-2 rounded-lg hover:bg-verde-esmeralda-700 disabled:opacity-50"
                >
                  {submitLoading ? 'Criando...' : 'Criar Unidade'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Unidades */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-verde-esmeralda-600">
            <h2 className="text-xl font-semibold text-white">
              Unidades Cadastradas ({unidades.length})
            </h2>
          </div>

          {unidades.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-6xl mb-4">🏠</div>
              <p className="text-lg">Nenhuma unidade cadastrada ainda</p>
              <p className="text-sm">Clique em "Nova Unidade" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unidade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Área
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Responsável
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Observações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {unidades.map((unidade) => (
                    <tr key={unidade.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {unidade.numero}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-verde-esmeralda-100 text-verde-esmeralda-800">
                          {getTipoLabel(unidade.tipo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {unidade.area ? `${unidade.area} m²` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {unidade.responsavel ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {unidade.responsavel.nome}
                            </div>
                            <div className="text-sm text-gray-500">
                              {unidade.responsavel.tipo}
                            </div>
                          </div>
                        ) : (
                          <Link
                            href={`/predios/${predioId}/unidades/${unidade.id}/responsavel`}
                            className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800 text-sm font-medium"
                          >
                            + Adicionar Responsável
                          </Link>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {unidade.observacoes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setUnidadeEditando(unidade)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => setUnidadeExcluindo(unidade)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            🗑️ Excluir
                          </button>
                          {unidade.responsavel && (
                            <Link
                              href={`/predios/${predioId}/unidades/${unidade.id}/responsavel`}
                              className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800 text-sm font-medium"
                            >
                              👤 Ver
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Editar */}
        {unidadeEditando && (
          <ModalEditarUnidade
            unidade={unidadeEditando}
            onClose={() => setUnidadeEditando(null)}
            onUpdate={() => {
              carregarDados()
              setUnidadeEditando(null)
            }}
          />
        )}

        {/* Modal Excluir */}
        {unidadeExcluindo && (
          <ModalConfirmarExclusao
            titulo="Excluir Unidade"
            mensagem={`Tem certeza que deseja excluir a unidade ${unidadeExcluindo.numero}? ${unidadeExcluindo.responsavel ? 'ATENÇÃO: Esta unidade possui responsável cadastrado!' : 'Esta ação não pode ser desfeita.'}`}
            onConfirmar={handleExcluirUnidade}
            onCancelar={() => setUnidadeExcluindo(null)}
          />
        )}
      </div>
    </div>
  )
}