// src/app/predios/[id]/unidades/[unidadeId]/responsaveis/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Responsavel {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone?: string;
  email?: string;
  tipo: string; // PROPRIETARIO | INQUILINO (ou lower no backend)
  ativo: boolean;
  ehTitularCobranca?: boolean;
}

export default function ListaResponsaveisPage() {
  const params = useParams() as { id: string; unidadeId: string };
  const router = useRouter();
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarInativos, setMostrarInativos] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro(null);
    try {
      const qs = mostrarInativos ? "?inativos=1" : "";
      const res = await fetch(
        `/api/predios/${params.id}/unidades/${params.unidadeId}${qs}`
      );
      if (!res.ok) throw new Error("Erro ao buscar unidade");
      const unidade = await res.json();
      // Normaliza tipo (apenas visual)
      const list: Responsavel[] = (unidade.responsaveis || []).map((r: any) => ({
        ...r,
        tipo: (r.tipo || "").toString().toUpperCase(),
      }));
      setResponsaveis(list);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function desativar(id: string) {
    if (!confirm("Deseja desativar este responsável?")) return;
    try {
      const res = await fetch(
        `/api/predios/${params.id}/unidades/${params.unidadeId}/responsaveis/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erro ao desativar responsável");
      await carregar();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function reativar(id: string, tornarTitular = false) {
    try {
      const res = await fetch(
        `/api/predios/${params.id}/unidades/${params.unidadeId}/responsaveis/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tornarTitular }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao reativar responsável");
      }
      await carregar();
    } catch (e: any) {
      alert(e.message);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInativos]); // recarrega quando alternar o filtro

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-4">
        <Link
          href={`/predios/${params.id}`}
          className="text-sm text-verde-esmeralda-700 hover:underline"
        >
          ← Voltar ao prédio
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold">Responsáveis</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={mostrarInativos}
              onChange={(e) => setMostrarInativos(e.target.checked)}
            />
            Mostrar inativos
          </label>
          <Link
            href={`/predios/${params.id}/unidades/${params.unidadeId}/responsaveis/novo`}
            className="btn-primary"
          >
            + Novo
          </Link>
        </div>
      </div>

      {loading && <p>Carregando...</p>}
      {erro && <p className="text-red-600">Erro: {erro}</p>}

      {!loading && !erro && responsaveis.length === 0 ? (
        <p className="text-gray-500 text-center py-10">
          {mostrarInativos
            ? "Nenhum responsável (ativos/inativos) encontrado."
            : "Nenhum responsável ativo encontrado."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {responsaveis.map((r) => (
            <li
              key={r.id}
              className="p-4 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-lg">{r.nome}</div>
                    <span className="uppercase text-xs text-gray-500">
                      ({r.tipo})
                    </span>
                    {!r.ativo && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        INATIVO
                      </span>
                    )}
                    {r.ehTitularCobranca && r.ativo && (
                      <span className="text-xs px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">
                        ⭐ Titular da cobrança
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {r.cpfCnpj} • {r.telefone || "—"} • {r.email || "—"}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Link
                    href={`/predios/${params.id}/unidades/${params.unidadeId}/responsaveis/${r.id}/editar`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Editar
                  </Link>

                  {r.ativo ? (
                    <button
                      onClick={() => desativar(r.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Desativar
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => reativar(r.id, false)}
                        className="text-sm text-green-700 hover:underline"
                      >
                        Reativar
                      </button>
                      <button
                        onClick={() => reativar(r.id, true)}
                        className="text-sm text-green-700 hover:underline"
                        title="Reativar e tornar titular"
                      >
                        Reativar como titular
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
