// src/app/predios/[id]/unidades/[unidadeId]/responsaveis/[responsavelId]/excluir/page.tsx
'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'

export default function ExcluirResponsavelPage() {
  const router = useRouter()
  const params = useParams() as { id: string, unidadeId: string, responsavelId: string }
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      setErro(null)

      const res = await fetch(`/api/predios/${params.id}/unidades/${params.unidadeId}/responsaveis/${params.responsavelId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err?.error || 'Erro ao excluir responsável')
      }

      router.push(`/predios/${params.id}/unidades/${params.unidadeId}/responsaveis`)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-xl font-bold text-red-600 mb-4">Excluir Responsável</h1>

      <p className="mb-4 text-gray-700">
        Tem certeza que deseja desativar este responsável? Esta ação é reversível e o histórico será mantido.
      </p>

      {erro && <p className="text-red-600 mb-4">Erro: {erro}</p>}

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="btn-outline">Cancelar</button>
        <button onClick={handleDelete} disabled={loading} className="btn-danger">
          {loading ? 'Excluindo...' : 'Excluir'}
        </button>
      </div>
    </div>
  )
}
