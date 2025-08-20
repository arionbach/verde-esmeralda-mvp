// src/components/ModalEditarPredio.tsx
'use client';

import { PredioForm, PredioFormValues } from '@/components/predios/PredioForm';
import { useState } from 'react';

// Interface alinhada ao Prisma
interface Predio {
  id: string;
  nome: string;
  endereco: string;
  cnpj: string | null;
  quantidadeUnidades: number;
  dataFundacao: string | null;
  nomeSindico: string | null;
  telefoneSindico: string | null;
  emailSindico: string | null;
}

interface ModalEditarPredioProps {
  predio: Predio;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ModalEditarPredio({ predio, onClose, onUpdate }: ModalEditarPredioProps) {
  const [saving, setSaving] = useState(false);

  const defaults: Partial<PredioFormValues> = {
    nome: predio.nome,
    endereco: predio.endereco,
    cnpj: predio.cnpj || '',
    quantidadeUnidades: predio.quantidadeUnidades,
    dataFundacao: predio.dataFundacao ? predio.dataFundacao.split('T')[0] : '',
    nomeSindico: predio.nomeSindico || '',
    telefoneSindico: predio.telefoneSindico || '',
    emailSindico: predio.emailSindico || '',
  };

  async function onSubmit(values: PredioFormValues) {
    setSaving(true);
    try {
      // payload já vem coerido (quantidadeUnidades = number)
      const res = await fetch(`/api/predios/${predio.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Erro ao atualizar prédio');
      }

      onUpdate();
      onClose();
    } catch (e: any) {
      alert(e?.message ?? 'Erro ao atualizar prédio');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-verde-esmeralda-800">Editar Prédio</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <PredioForm
          defaultValues={defaults}
          onSubmit={onSubmit}
          submitLabel={saving ? 'Salvando...' : 'Salvar'}
          disabled={saving}
        />

        <div className="mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
