// src/components/predios/PredioForm.tsx
"use client";

import { useEffect, useState } from "react";

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

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

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

  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setOk(false), 2500);
    return () => clearTimeout(t);
  }, [ok]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    // validações simples (client)
    if (!values.nome.trim()) return setError("Informe o nome do condomínio.");
    if (!values.endereco.trim()) return setError("Informe o endereço.");

    const q = Number(values.quantidadeUnidades);
    if (!Number.isFinite(q) || q < 1) {
      return setError("Quantidade de unidades deve ser maior ou igual a 1.");
    }

    if (values.emailSindico && values.emailSindico.trim() && !isEmail(values.emailSindico.trim())) {
      return setError("E-mail do síndico inválido.");
    }

    // payload higienizado (evita 400 no backend)
    const payload: PredioFormValues = {
      nome: values.nome.trim(),
      endereco: values.endereco.trim(),
      quantidadeUnidades: q, // já garantido >=1
      cnpj: values.cnpj?.trim() || undefined,
      dataFundacao: values.dataFundacao?.trim() || undefined, // "YYYY-MM-DD" ou undefined
      nomeSindico: values.nomeSindico?.trim() || undefined,
      telefoneSindico: values.telefoneSindico?.trim() || undefined,
      emailSindico: values.emailSindico?.trim() || undefined,
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
      setOk(true);
      // reset básico
      setValues(v => ({
        ...v,
        nome: "",
        endereco: "",
        quantidadeUnidades: 1,
        cnpj: "",
        dataFundacao: "",
        nomeSindico: "",
        telefoneSindico: "",
        emailSindico: "",
      }));
    } catch (err: any) {
      setError(err?.message || "Falha ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  const hasError = !!error;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-live="polite">
      {error && (
        <div
          id="form-error"
          className="md:col-span-2 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3"
        >
          {error}
        </div>
      )}
      {ok && (
        <div className="md:col-span-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3">
          Prédio salvo com sucesso!
        </div>
      )}

      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
          Nome do Condomínio *
        </label>
        <input
          id="nome"
          value={values.nome}
          onChange={e => set("nome", e.target.value)}
          required
          aria-invalid={hasError && !values.nome.trim()}
          aria-describedby={hasError ? "form-error" : undefined}
          placeholder="Ex: Residencial Verde Mar"
          autoComplete="organization"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700 mb-1">
          Quantidade de Unidades *
        </label>
        <input
          id="quantidade"
          type="number"
          min={1}
          value={values.quantidadeUnidades}
          onChange={e => {
            const n = Number(e.target.value);
            set("quantidadeUnidades", Number.isFinite(n) && n >= 1 ? n : 1);
          }}
          required
          inputMode="numeric"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500 focus:border-transparent"
          placeholder="Ex: 14"
        />
      </div>

      <div className="md:col-span-2">
        <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">
          Endereço Completo *
        </label>
        <input
          id="endereco"
          value={values.endereco}
          onChange={e => set("endereco", e.target.value)}
          required
          aria-invalid={hasError && !values.endereco.trim()}
          aria-describedby={hasError ? "form-error" : undefined}
          placeholder="Rua, número — Bairro — Cidade/UF"
          autoComplete="street-address"
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
          autoComplete="off"
          inputMode="numeric"
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
          autoComplete="name"
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
          autoComplete="tel"
          inputMode="tel"
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
          autoComplete="email"
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
