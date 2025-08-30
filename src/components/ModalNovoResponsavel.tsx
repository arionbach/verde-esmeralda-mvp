// src/components/ModalNovoResponsavel.tsx
'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { ResponsavelTipo } from '@prisma/client'

interface Props {
  isOpen: boolean
  onClose: () => void
  unidadeId: string
  predioId: string
  onSuccess: () => void
}

export default function ModalNovoResponsavel({ isOpen, onClose, unidadeId, predioId, onSuccess }: Props) {
  const [nome, setNome] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState<ResponsavelTipo>('PROPRIETARIO')
  const [ehTitular, setEhTitular] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSalvar() {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`/api/predios/${predioId}/unidades/${unidadeId}/responsaveis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cpfCnpj, telefone, whatsapp, email, tipo, ehTitularCobranca: ehTitular })
      })

      if (!res.ok) throw new Error('Erro ao salvar responsável')

      onSuccess()
      onClose()
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white p-6 rounded-xl shadow-lg w-full max-w-xl">
          <Dialog.Title className="text-lg font-bold mb-4">Novo Responsável</Dialog.Title>

          <div className="grid grid-cols-1 gap-3">
            <input className="input" placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} />
            <input className="input" placeholder="CPF ou CNPJ" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value)} />
            <input className="input" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
            <input className="input" placeholder="WhatsApp" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
            <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />

            <select value={tipo} onChange={e => setTipo(e.target.value as ResponsavelTipo)} className="input">
              <option value="PROPRIETARIO">Proprietário</option>
              <option value="INQUILINO">Inquilino</option>
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={ehTitular} onChange={e => setEhTitular(e.target.checked)} />
              Titular da cobrança
            </label>

            {erro && <div className="text-sm text-red-600">{erro}</div>}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onClose} className="btn">Cancelar</button>
            <button onClick={handleSalvar} disabled={loading} className="btn-primary">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

