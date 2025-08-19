// src/components/ModalConfirmarExclusao.tsx
'use client'

import { useState } from 'react'

interface ModalConfirmarExclusaoProps {
  titulo: string
  mensagem: string
  onConfirmar: () => Promise<void>
  onCancelar: () => void
}

export default function ModalConfirmarExclusao({
  titulo,
  mensagem,
  onConfirmar,
  onCancelar
}: ModalConfirmarExclusaoProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirmar = async () => {
    setLoading(true)
    try {
      await onConfirmar()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-gray-900">
            {titulo}
          </h3>
        </div>

        <p className="text-gray-600 mb-6">
          {mensagem}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}