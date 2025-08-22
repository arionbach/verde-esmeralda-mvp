// src/app/predios/[id]/unidades/[unidadeId]/responsaveis/novo/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import { ResponsavelCreateSchema, type ResponsavelCreateInput } from '@/app/api/_schemas'
import { z } from 'zod'

const camposIniciais: ResponsavelCreateInput = {
  nome: '',
  cpfCnpj: '',
  telefone: '',
  whatsapp: '',
  email: '',
  tipo: 'PROPRIETARIO',
  ehTitularCobranca: false,
  dataInicio: new Date(),
  dataFim: null,
  ativo: true,
}

export default function NovoResponsavelPage() {
  const router = useRouter()
  const params = useParams() as { id: string, unidadeId: string }
  const [dados, setDados] = useState<ResponsavelCreateInput>(camposIniciais)
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (campo: keyof ResponsavelCreateInput, valor: any) => {
    setDados(prev => ({ ...prev, [campo]: valor }))
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setErro(null)
      const data = ResponsavelCreateSchema.parse(dados)

      const res = await fetch(`/api/predios/${params.id}/unidades/${params.unidadeId}/responsaveis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err?.error || 'Erro ao salvar responsável')
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
      <h1 className="text-2xl font-bold mb-4">Novo Responsável</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Nome" className="input"
          value={dados.nome} onChange={e => handleChange('nome', e.target.value)} />
        <input type="text" placeholder="CPF ou CNPJ" className="input"
          value={dados.cpfCnpj} onChange={e => handleChange('cpfCnpj', e.target.value)} />
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
        <button onClick={() => router.back()} className="btn-outline">Cancelar</button>
        <button onClick={handleSubmit} disabled={loading} className="btn-primary">
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
} // estilos utilitários tailwind como .input, .btn-primary, .btn-outline devem existir no projeto
