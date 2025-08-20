// src/components/predios/PredioForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const Schema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  endereco: z.string().min(1, "Informe o endereço"),
  cnpj: z.string().optional(),
  // ❌ sem .default(0) para não tornar o input opcional
  quantidadeUnidades: z.coerce.number().int().nonnegative({
    message: "Informe um número inteiro ≥ 0",
  }),
  dataFundacao: z.string().optional(), // backend converte p/ Date
  nomeSindico: z.string().optional(),
  telefoneSindico: z.string().optional(),
  emailSindico: z.string().email("E-mail inválido").optional(),
});

export type PredioFormValues = z.infer<typeof Schema>;

export function PredioForm({
  defaultValues,
  onSubmit,
  submitLabel = "Salvar",
  disabled = false,
}: {
  defaultValues?: Partial<PredioFormValues>;
  onSubmit: (values: PredioFormValues) => Promise<void> | void;
  submitLabel?: string;
  disabled?: boolean;
}) {
  // defaults seguros para evitar undefined em campos obrigatórios
  const mergedDefaults: PredioFormValues = {
    nome: "",
    endereco: "",
    quantidadeUnidades: 0,
    cnpj: "",
    dataFundacao: "",
    nomeSindico: "",
    telefoneSindico: "",
    emailSindico: "",
    ...(defaultValues as any),
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PredioFormValues>({
    resolver: zodResolver(Schema),
    defaultValues: mergedDefaults,
  });

  const isBusy = disabled || isSubmitting;
  const inputCls =
    "w-full p-2 border rounded-lg focus:ring-2 focus:ring-verde-esmeralda-500";
  const labelCls = "block text-sm font-medium mb-1";
  const errCls = "text-red-500 text-sm mt-1";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* Nome */}
      <div className="md:col-span-2">
        <label className={labelCls}>Nome do Prédio *</label>
        <input
          className={inputCls}
          {...register("nome")}
          disabled={isBusy}
          placeholder="Ex: Edifício Central"
        />
        {errors.nome && <p className={errCls}>{errors.nome.message}</p>}
      </div>

      {/* Quantidade / CNPJ */}
      <div>
        <label className={labelCls}>Quantidade de Unidades</label>
        <input
          type="number"
          className={inputCls}
          {...register("quantidadeUnidades", { valueAsNumber: true })}
          disabled={isBusy}
          placeholder="Ex: 24"
          min={0}
        />
        {errors.quantidadeUnidades && (
          <p className={errCls}>{errors.quantidadeUnidades.message}</p>
        )}
      </div>
      <div>
        <label className={labelCls}>CNPJ</label>
        <input
          className={inputCls}
          {...register("cnpj")}
          disabled={isBusy}
          placeholder="00.000.000/0000-00"
        />
        {errors.cnpj && <p className={errCls}>{errors.cnpj.message}</p>}
      </div>

      {/* Endereço */}
      <div className="md:col-span-2">
        <label className={labelCls}>Endereço *</label>
        <input
          className={inputCls}
          {...register("endereco")}
          disabled={isBusy}
          placeholder="Rua, número, bairro, cidade"
        />
        {errors.endereco && <p className={errCls}>{errors.endereco.message}</p>}
      </div>

      {/* Data de Fundação */}
      <div>
        <label className={labelCls}>Data de Fundação</label>
        <input
          type="date"
          className={inputCls}
          {...register("dataFundacao")}
          disabled={isBusy}
        />
      </div>

      {/* Síndico / Telefone */}
      <div>
        <label className={labelCls}>Nome do Síndico</label>
        <input
          className={inputCls}
          {...register("nomeSindico")}
          disabled={isBusy}
          placeholder="Nome completo"
        />
      </div>
      <div>
        <label className={labelCls}>Telefone do Síndico</label>
        <input
          className={inputCls}
          {...register("telefoneSindico")}
          disabled={isBusy}
          placeholder="(00) 00000-0000"
        />
      </div>

      {/* Email */}
      <div className="md:col-span-2">
        <label className={labelCls}>Email do Síndico</label>
        <input
          type="email"
          className={inputCls}
          {...register("emailSindico")}
          disabled={isBusy}
          placeholder="sindico@exemplo.com"
        />
        {errors.emailSindico && (
          <p className={errCls}>{errors.emailSindico.message}</p>
        )}
      </div>

      {/* Ações */}
      <div className="md:col-span-2">
        <button
          type="submit"
          className="bg-verde-esmeralda-600 text-white px-6 py-2 rounded-lg hover:bg-verde-esmeralda-700 disabled:opacity-50"
          disabled={isBusy}
        >
          {isSubmitting ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default PredioForm;
