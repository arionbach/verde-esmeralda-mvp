// src/app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ModalEditarPredio from "@/components/ModalEditarPredio";
import ModalConfirmarExclusao from "@/components/ModalConfirmarExclusao";

type Predio = {
  id: string;
  nome: string;
  endereco: string;
  quantidadeUnidades: number;
  nomeSindico: string | null;
  telefoneSindico: string | null;
  emailSindico: string | null;
  cnpj: string | null;
  dataFundacao: string | null;
  _count: { unidades: number };
};

export default function Home() {
  const [predios, setPredios] = useState<Predio[]>([]);
  const [loading, setLoading] = useState(true);

  // modais
  const [predioEditando, setPredioEditando] = useState<Predio | null>(null);
  const [predioExcluindo, setPredioExcluindo] = useState<Predio | null>(null);

  const carregarPredios = async () => {
    try {
      const r = await fetch("/api/predios");
      if (!r.ok) throw new Error("Falha ao carregar prédios");
      const data = await r.json();
      setPredios(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setPredios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPredios();
  }, []);

  // KPIs
  const totalPredios = predios.length;
  const unidadesCadastradas = useMemo(
    () => predios.reduce((acc, p) => acc + (p._count?.unidades ?? 0), 0),
    [predios]
  );
  const unidadesPrevistas = useMemo(
    () => predios.reduce((acc, p) => acc + (p.quantidadeUnidades ?? 0), 0),
    [predios]
  );
  const cadastroPct = useMemo(() => {
    if (!unidadesPrevistas) return 0;
    return Math.min(
      100,
      Math.round((unidadesCadastradas / unidadesPrevistas) * 100)
    );
  }, [unidadesCadastradas, unidadesPrevistas]);

  // Alertas
  const prediosComFalta = predios.filter(
    (p) => (p.quantidadeUnidades ?? 0) > (p._count?.unidades ?? 0)
  );
  const prediosSemSindico = predios.filter((p) => !p.nomeSindico?.trim());
  const prediosSemContato = predios.filter(
    (p) => !p.emailSindico?.trim() && !p.telefoneSindico?.trim()
  );

  // excluir prédio
  const handleExcluirPredio = async () => {
    if (!predioExcluindo) return;
    try {
      const res = await fetch(`/api/predios/${predioExcluindo.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Erro ao excluir prédio");
      }
      setPredioExcluindo(null);
      await carregarPredios();
    } catch (e: any) {
      alert(e?.message || "Falha ao excluir prédio");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-verde-esmeralda-50 flex items-center justify-center text-verde-esmeralda-600">
        Carregando…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-verde-esmeralda-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* HERO + AÇÕES */}
        <section className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-verde-esmeralda-800">
                Verde Esmeralda
              </h1>
              <p className="text-sm text-emerald-700/80">
                Sistema de Gestão de Condomínios
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/predios"
                className="px-4 py-2 rounded-lg bg-verde-esmeralda-600 text-white hover:bg-verde-esmeralda-700"
              >
                + Novo Prédio
              </Link>
              <Link
                href="/predios"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Ver todos os prédios
              </Link>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Prédios" value={totalPredios} />
          <KpiCard label="Unidades cadastradas" value={unidadesCadastradas} />
          <KpiCard label="Unidades previstas" value={unidadesPrevistas || "—"} />
          <KpiProgress
            label="Progresso de cadastro"
            value={cadastroPct}
            hint={
              unidadesPrevistas
                ? `${unidadesCadastradas}/${unidadesPrevistas} unidades`
                : "Cadastre a quantidade prevista em cada prédio"
            }
          />
        </section>

        {/* ALERTAS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <AlertCard
            title="Faltam unidades cadastradas"
            count={prediosComFalta.length}
            items={prediosComFalta.slice(0, 3).map((p) => ({
              id: p.id,
              primary: p.nome,
              secondary: `${p._count.unidades}/${p.quantidadeUnidades} unidades`,
            }))}
            empty="Tudo em dia!"
          />
          <AlertCard
            title="Prédios sem síndico"
            count={prediosSemSindico.length}
            items={prediosSemSindico
              .slice(0, 3)
              .map((p) => ({ id: p.id, primary: p.nome, secondary: p.endereco }))}
            empty="Nenhum prédio sem síndico."
          />
          <AlertCard
            title="Sem contato (e-mail/telefone)"
            count={prediosSemContato.length}
            items={prediosSemContato
              .slice(0, 3)
              .map((p) => ({ id: p.id, primary: p.nome, secondary: p.endereco }))}
            empty="Todos com contato cadastrado."
          />
        </section>

        {/* PRÉDIOS (RESUMO) + AÇÕES */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-verde-esmeralda-800">Prédios</h2>
            <Link
              href="/predios"
              className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800 text-sm"
            >
              Ver todos →
            </Link>
          </div>

          {predios.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-gray-600 bg-gray-50">
              Nenhum prédio cadastrado. Comece criando o primeiro.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {predios.map((p) => {
                const cad = p._count?.unidades ?? 0;
                const prev = p.quantidadeUnidades ?? 0;
                const pct = prev ? Math.min(100, Math.round((cad / prev) * 100)) : 0;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative"
                  >
                    {/* Ações: editar/excluir */}
                    <div className="absolute top-3 right-3 flex gap-1">
                      <button
                        onClick={() => setPredioEditando(p)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm"
                        title="Editar prédio"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setPredioExcluindo(p)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm"
                        title="Excluir prédio"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="flex items-start justify-between pr-14">
                      <div>
                        <h3 className="text-lg font-semibold text-verde-esmeralda-800">
                          {p.nome}
                        </h3>
                        <p className="text-sm text-gray-600">📍 {p.endereco}</p>
                      </div>
                      {p.nomeSindico && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          Síndico: {p.nomeSindico}
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">Cadastro de unidades</span>
                        <span className="text-gray-700">
                          {cad}/{prev || "—"}
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      <Link
                        href={`/predios/${p.id}`}
                        className="px-3 py-2 rounded-lg bg-verde-esmeralda-600 text-white hover:bg-verde-esmeralda-700 text-sm"
                      >
                        Gerenciar
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modais */}
      {predioEditando && (
        <ModalEditarPredio
          predio={predioEditando}
          onClose={() => setPredioEditando(null)}
          onUpdate={async () => {
            await carregarPredios();
            setPredioEditando(null);
          }}
        />
      )}

      {predioExcluindo && (
        <ModalConfirmarExclusao
          item={`Prédio "${predioExcluindo.nome}"`}
          onConfirm={handleExcluirPredio}
          onCancel={() => setPredioExcluindo(null)}
        />
      )}
    </main>
  );
}

/* UI helpers (mantidos) */
function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-verde-esmeralda-800">
        {value}
      </div>
    </div>
  );
}

function KpiProgress({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-sm font-medium text-verde-esmeralda-800">
          {value}%
        </div>
      </div>
      <div className="mt-2">
        <Progress value={value} />
      </div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-verde-esmeralda-600" style={{ width: `${value}%` }} />
    </div>
  );
}

function AlertCard({
  title,
  count,
  items,
  empty,
}: {
  title: string;
  count: number;
  items: { id: string; primary: string; secondary?: string }[];
  empty: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
        <span className="px-2 py-1 rounded-full text-xs bg-amber-50 text-amber-700">
          {count}
        </span>
      </div>
      {count === 0 ? (
        <div className="text-sm text-gray-500">{empty}</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-800">{it.primary}</div>
                {it.secondary && (
                  <div className="text-xs text-gray-500">{it.secondary}</div>
                )}
              </div>
              <Link
                href={`/predios/${it.id}`}
                className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800 text-sm"
              >
                abrir →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
