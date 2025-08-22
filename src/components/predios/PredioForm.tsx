// src/components/predios/PredioForm.tsx
"use client";

import { useState } from "react";

export type PredioFormValues = {
  nome: string;
  endereco: string;
  quantidadeUnidades: number;
  cnpj?: string;
  dataFundacao?: string; // "YYYY-MM-DD"
  nomeSindico?: string;
  telefoneSindico?: string;
  emailSindico?: string;
};

type Props = {
  defaultValues?: Partial<PredioFormValues>;
  submitLabel?: string;
  onSubmit: (values: PredioFormValues) => Promise<void> | void;
};

export function PredioForm({ defaultValues, submitLabel = "Salvar", onSubmit }: Props) {
  const [values, setValues] = useState<PredioFormValues>({
    nome: defaultValues?.nome ?? "",
    endereco: defaultValues?.endereco ?? "",
    quantidadeUnidades: defaultValues?.quantidadeUnidades ?? 1,
    cnpj: defaultValues?.cnpj ?? "",
    dataFundacao: defaultValues?.dataFundacao ?? "",
    nomeSindico: defaultValues?.nomeSindico ?? "",
    telefoneSindico: defaultValues?.telefoneSindico ?? "",
    emailSindico: defaultValues?.emailSindico ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function set<K extends keyof PredioFormValues>(key: K, v: PredioFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    // validações simples
    if (!values.nome.trim()) return setError("Informe o nome do condomínio.");
    if (!values.endereco.trim()) return setError("Informe o endereço.");
    if (!Number.isFinite(values.quantidadeUnidades) || values.quantidadeUnidades < 1) {
      return setError("Quantidade de unidades deve ser maior ou igual a 1.");
    }

    // payload higienizado
    const payload: PredioFormValues = {
      ...values,
      quantidadeUnidades: Number(values.quantidadeUnidades),
      cnpj: values.cnpj?.trim() || undefined,
      dataFundacao: values.dataFundacao?.trim() || undefined,
      nomeSindico: values.nomeSindico?.trim() || undefined,
      telefoneSindico: values.telefoneSindico?.trim() || undefined,
      emailSindico: values.emailSindico?.trim() || undefined,
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
      setOk(true);
      // opcional: reset nos campos principais
      setValues(v => ({ ...v, nome: "", endereco: "", quantidadeUnidades: 1 }));
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar.");
    } finally {
      setSubmitting(false);
      // apaga “ok” depois de alguns segundos
      setTimeout(() => setOk(false), 2500);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-live="polite">
      {error && (
        <div className="md:col-span-2 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3">
          {error}
        </div>
      )}
      {ok && (
        <div className="md:col-span-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3">
          Prédio salvo com sucesso!
        </div>
      )}

      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome do Condomínio *</label>
        <input
          id="nome"
          value={values.nome}
          onChange={e => set("nome", e.target.value)}
          required
          placeholder="Ex: Residencial Verde Mar"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700 mb-1">Quantidade de Unidades *</label>
        <input
          id="quantidade"
          type="number"
          min={1}
          value={values.quantidadeUnidades}
          onChange={e => set("quantidadeUnidades", Number(e.target.value || 1))}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
          placeholder="Ex: 14"
          required
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo *</label>
        <input
          id="endereco"
          value={values.endereco}
          onChange={e => set("endereco", e.target.value)}
          required
          placeholder="Rua, número — Bairro — Cidade/UF"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
        <input
          id="cnpj"
          value={values.cnpj || ""}
          onChange={e => set("cnpj", e.target.value)}
          placeholder="00.000.000/0000-00"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="fundacao" className="block text-sm font-medium text-gray-700 mb-1">Data de Fundação</label>
        <input
          id="fundacao"
          type="date"
          value={values.dataFundacao || ""}
          onChange={e => set("dataFundacao", e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="sindico" className="block text-sm font-medium text-gray-700 mb-1">Nome do Síndico</label>
        <input
          id="sindico"
          value={values.nomeSindico || ""}
          onChange={e => set("nomeSindico", e.target.value)}
          placeholder="Nome completo"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
        <input
          id="telefone"
          value={values.telefoneSindico || ""}
          onChange={e => set("telefoneSindico", e.target.value)}
          placeholder="(11) 91234-5678"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
        <input
          id="email"
          type="email"
          value={values.emailSindico || ""}
          onChange={e => set("emailSindico", e.target.value)}
          placeholder="sindico@exemplo.com"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
        />
      </div>

      <div className="md:col-span-2 flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-verde-esmeralda-600 text-white px-6 py-2 rounded-lg hover:bg-verde-esmeralda-700 transition-colors disabled:opacity-50"
        >
          {submitting ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
