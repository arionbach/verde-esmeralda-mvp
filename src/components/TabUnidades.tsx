// src/components/TabUnidades.tsx - VERSÃO CORRIGIDA E FUNCIONAL
"use client";

import Link from "next/link";

// Exporta as funções helpers para uso em outros componentes
export { normalizeTipo, normalizeStatus, getTipoLabel, getTipoResponsavel };

interface Responsavel {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string | null;
  email: string | null;
  tipo: string;
  ativo: boolean;
}

interface Unidade {
  id: string;
  numero: string;
  tipo: string;
  metragem: number | null;
  fracaoIdeal: number | null;
  valorTaxa: number | string;
  status: string;
  responsaveis?: Responsavel[];
  responsavel?: Responsavel | null;
}

interface TabUnidadesProps {
  predioId: string;
  itens: any[]; // Aceita any para lidar com dados não normalizados
  onRefresh: () => Promise<void>;
  loading: boolean;
}

// Normaliza tipo para minúsculo
function normalizeTipo(tipo: string): string {
  return (tipo || "apartamento").toLowerCase();
}

// Normaliza status para minúsculo
function normalizeStatus(status: string): string {
  return (status || "vazio").toLowerCase();
}

// Normaliza responsável tipo
function normalizeResponsavelTipo(tipo: string): string {
  return (tipo || "proprietario").toLowerCase();
}

// Label amigável para tipo
function getTipoLabel(tipo: string): string {
  const tipos: Record<string, string> = {
    apartamento: "Apartamento",
    cobertura: "Cobertura",
    loja: "Loja",
    garagem: "Garagem",
    APARTAMENTO: "Apartamento",
    COBERTURA: "Cobertura",
    LOJA: "Loja",
    GARAGEM: "Garagem",
  };
  return tipos[tipo] || tipo;
}

// Label amigável para tipo de responsável
function getTipoResponsavel(tipo: string): string {
  const tipos: Record<string, string> = {
    proprietario: "Proprietário",
    inquilino: "Inquilino",
    PROPRIETARIO: "Proprietário",
    INQUILINO: "Inquilino",
  };
  return tipos[tipo] || tipo;
}

// Normaliza uma unidade completa
function normalizeUnidade(u: any): Unidade {
  // Pega o responsável ativo
  const responsavelAtivo =
    u.responsaveis?.find((r: any) => r.ativo) || u.responsavel || null;

  return {
    id: u.id,
    numero: u.numero,
    tipo: normalizeTipo(u.tipo),
    status: normalizeStatus(u.status),
    metragem: u.metragem,
    fracaoIdeal: u.fracaoIdeal,
    valorTaxa:
      typeof u.valorTaxa === "number" ? u.valorTaxa : Number(u.valorTaxa || 0),
    responsaveis: u.responsaveis || [],
    responsavel: responsavelAtivo,
  };
}

export default function TabUnidades({
  predioId,
  itens,
  onRefresh,
  loading,
}: TabUnidadesProps) {
  // Normaliza todas as unidades
  const unidadesNormalizadas = Array.isArray(itens)
    ? itens.map(normalizeUnidade)
    : [];

  console.log("🔍 TabUnidades - Dados recebidos:", {
    predioId,
    itens,
    loading,
  });
  console.log("🔍 TabUnidades - Unidades normalizadas:", unidadesNormalizadas);

  return (
    <section className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-lg font-semibold text-verde-esmeralda-800">
          Unidades ({unidadesNormalizadas.length})
        </h2>
        <div className="flex gap-2">
          <Link
            href={`/predios/${predioId}/unidades/nova`}
            className="px-4 py-2 rounded-lg bg-verde-esmeralda-600 text-white hover:bg-verde-esmeralda-700"
          >
            + Nova Unidade
          </Link>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {loading ? "Atualizando…" : "Atualizar"}
          </button>
        </div>
      </div>

      {unidadesNormalizadas.length === 0 ? (
        <div className="p-10 text-center text-gray-600 bg-gray-50 rounded-lg border border-dashed">
          <div className="text-4xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold mb-2">
            Nenhuma unidade cadastrada
          </h3>
          <p className="text-gray-500 mb-4">
            Comece cadastrando a primeira unidade deste prédio
          </p>
          <Link
            href={`/predios/${predioId}/unidades/nova`}
            className="inline-block px-6 py-2 bg-verde-esmeralda-600 text-white rounded-lg hover:bg-verde-esmeralda-700 font-medium"
          >
            Cadastrar primeira unidade →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {unidadesNormalizadas.map((u) => {
            const statusOcupado = u.status === "ocupado";
            const valorTaxa =
              typeof u.valorTaxa === "number"
                ? u.valorTaxa
                : Number(u.valorTaxa || 0);

            return (
              <article
                key={u.id}
                className="bg-white rounded-2xl shadow-sm border border-verde-esmeralda-100 hover:shadow-md transition"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-verde-esmeralda-900">
                        Unidade {u.numero}
                      </h3>
                      <div className="mt-1 text-sm text-gray-600">
                        {getTipoLabel(u.tipo)} •{" "}
                        {u.metragem ? `${u.metragem} m²` : "—"}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusOcupado
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {statusOcupado ? "Ocupada" : "Vazia"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                      <span className="text-gray-500">Fração ideal:</span>{" "}
                      <span className="font-medium">
                        {u.fracaoIdeal ?? "—"}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Taxa mensal:</span>{" "}
                      <span className="font-medium">
                        R$ {valorTaxa.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {u.responsavel && (
                    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Responsável:</span>{" "}
                        {u.responsavel.nome} (
                        {getTipoResponsavel(u.responsavel.tipo)})
                      </div>
                      {(u.responsavel.telefone || u.responsavel.email) && (
                        <div className="text-xs text-gray-500">
                          {u.responsavel.telefone || "—"} •{" "}
                          {u.responsavel.email || "—"}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/predios/${predioId}/unidades/${u.id}`}
                      className="rounded-lg bg-verde-esmeralda-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-verde-esmeralda-700"
                    >
                      Gerenciar
                    </Link>

                    <Link
                      href={`/predios/${predioId}/unidades/${u.id}/responsaveis`}
                      className="rounded-lg bg-blue-50 px-3.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100"
                    >
                      Responsáveis
                    </Link>

                   
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
