// src/app/predios/[id]/unidades/[unidadeId]/responsaveis/[responsavelId]/editar/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ResponsavelUpdateSchema, type ResponsavelUpdateInput } from '@/app/api/_schemas'
import { z } from 'zod'

const camposIniciais: ResponsavelUpdateInput = {
  nome: '',
  cpfCnpj: '',
  telefone: '',
  whatsapp: '',
  email: '',
  tipo: 'PROPRIETARIO',
  ehTitularCobranca: false,
  dataInicio: undefined,
  dataFim: undefined,
  ativo: true
}

export default function EditarResponsavelPage() {
  const router = useRouter()
  const params = useParams() as { id: string; unidadeId: string; responsavelId: string }
  const [dados, setDados] = useState<ResponsavelUpdateInput>(camposIniciais)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      try {
        setCarregando(true)
        const res = await fetch(`/api/predios/${params.id}/unidades/${params.unidadeId}`)
        if (!res.ok) throw new Error('Erro ao buscar unidade')
        const unidade = await res.json()
        const responsavel = unidade.responsaveis.find((r: any) => r.id === params.responsavelId)
        if (!responsavel) throw new Error('Responsável não encontrado')
        setDados(responsavel)
      } catch (e: any) {
        setErro(e.message)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  const handleChange = (campo: keyof ResponsavelUpdateInput, valor: any) => {
    setDados(prev => ({ ...prev, [campo]: valor }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setErro(null)
      const data = ResponsavelUpdateSchema.parse(dados)

      const res = await fetch(`/api/predios/${params.id}/unidades/${params.unidadeId}/responsaveis/${params.responsavelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err?.error || 'Erro ao atualizar responsável')
      }

      router.push(`/predios/${params.id}/unidades/${params.unidadeId}/responsaveis`)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <button onClick={() => router.push(`/predios/${params.id}`)} className="text-sm text-verde-esmeralda-700 hover:underline mb-4">
        ← Voltar ao prédio
      </button>

      <h1 className="text-2xl font-bold mb-4">Editar Responsável</h1>

      {carregando ? (
        <p className="text-gray-500">Carregando…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nome" className="input"
              value={dados.nome || ''} onChange={e => handleChange('nome', e.target.value)} />
            <input type="text" placeholder="CPF ou CNPJ" className="input"
              value={dados.cpfCnpj || ''} onChange={e => handleChange('cpfCnpj', e.target.value)} />
            <input type="text" placeholder="Telefone" className="input"
              value={dados.telefone || ''} onChange={e => handleChange('telefone', e.target.value)} />
            <input type="text" placeholder="Whatsapp" className="input"
              value={dados.whatsapp || ''} onChange={e => handleChange('whatsapp', e.target.value)} />
            <input type="email" placeholder="Email" className="input"
              value={dados.email || ''} onChange={e => handleChange('email', e.target.value)} />
            <select value={dados.tipo} onChange={e => handleChange('tipo', e.target.value)} className="input">
              <option value="PROPRIETARIO">Proprietário</option>
              <option value="INQUILINO">Inquilino</option>
            </select>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={dados.ehTitularCobranca} 
                onChange={e => handleChange('ehTitularCobranca', e.target.checked)} /> Titular da Cobrança
            </label>
          </div>

          {erro && <p className="mt-4 text-red-600">Erro: {erro}</p>}

          <div className="mt-6 flex gap-2">
            <button onClick={() => router.push(`/predios/${params.id}/unidades/${params.unidadeId}/responsaveis`)} className="btn-outline">Cancelar</button>
            <button onClick={handleSubmit} disabled={loading} className="btn-primary">
              {loading ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
