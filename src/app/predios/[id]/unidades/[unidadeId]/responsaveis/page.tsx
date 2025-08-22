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
  tipo: string;
  ativo: boolean;
  ehTitularCobranca?: boolean;
}

export default function ListaResponsaveisPage() {
  const params = useParams() as { id: string; unidadeId: string };
  const router = useRouter();
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(
        `/api/predios/${params.id}/unidades/${params.unidadeId}`
      );
      if (!res.ok) throw new Error("Erro ao buscar unidade");
      const unidade = await res.json();
      setResponsaveis(unidade.responsaveis);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  const desativar = async (id: string) => {
    if (!confirm("Deseja desativar este responsável?")) return;
    try {
      const res = await fetch(
        `/api/predios/${params.id}/unidades/${params.unidadeId}/responsaveis/${id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Erro ao desativar responsável");
      await carregar();
    } catch (e: any) {
      alert(e.message);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-4">
        <Link
          href={`/predios/${params.id}`}
          className="text-sm text-verde-esmeralda-700 hover:underline"
        >
          ← Voltar ao prédio
        </Link>{" "}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Responsáveis</h1>
        <Link
          href={`/predios/${params.id}/unidades/${params.unidadeId}/responsaveis/novo`}
          className="btn-primary"
        >
          + Novo
        </Link>
      </div>

      {loading && <p>Carregando...</p>}
      {erro && <p className="text-red-600">Erro: {erro}</p>}

      {responsaveis.length === 0 ? (
        <p className="text-gray-500 text-center py-10">
          Nenhum responsável ativo encontrado.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {responsaveis.map((r) => (
            <li
              key={r.id}
              className="p-4 rounded-lg border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">
                    {r.nome}{" "}
                    <span className="uppercase text-sm text-gray-500">
                      ({r.tipo})
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {r.cpfCnpj} • {r.telefone || "—"} • {r.email || "—"}
                  </div>
                  {r.ehTitularCobranca && (
                    <div className="text-xs text-yellow-700 mt-1 font-medium">
                      ⭐ Titular da cobrança
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Link
                    href={`/predios/${params.id}/unidades/${params.unidadeId}/responsaveis/${r.id}/editar`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => desativar(r.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Desativar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
