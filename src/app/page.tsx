// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ModalEditarPredio from "@/components/ModalEditarPredio";
import ModalConfirmarExclusao from "@/components/ModalConfirmarExclusao";
import { PredioForm, PredioFormValues } from "@/components/predios/PredioForm";

// ✅ Interface CORRIGIDA para bater com Schema Prisma
interface Predio {
  id: string;
  nome: string;
  endereco: string;
  cnpj: string | null;
  quantidadeUnidades: number;
  dataFundacao: string | null;
  nomeSindico: string | null; // ✅ Corrigido de 'sindico'
  telefoneSindico: string | null; // ✅ Corrigido de 'telefone'
  emailSindico: string | null; // ✅ Corrigido de 'email'
  createdAt: string;
  _count: {
    unidades: number;
  };
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");
  const [predios, setPredios] = useState<Predio[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [novoPredio, setNovoPredio] = useState({
    nome: "",
    endereco: "",
    cnpj: "",
    quantidadeUnidades: "",
    dataFundacao: "",
    nomeSindico: "", // ✅ Corrigido de 'sindico'
    telefoneSindico: "", // ✅ Corrigido de 'telefone'
    emailSindico: "", // ✅ Corrigido de 'email'
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Estados para modais
  const [predioEditando, setPredioEditando] = useState<Predio | null>(null);
  const [predioExcluindo, setPredioExcluindo] = useState<Predio | null>(null);

  const carregarPredios = async () => {
    try {
      const response = await fetch("/api/predios");
      if (response.ok) {
        const data = await response.json();
        setPredios(data);
      }
    } catch (error) {
      console.error("Erro ao carregar prédios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPredios();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    // 🔽 monta payload coerido antes do fetch
    const payload = {
      ...novoPredio,
      quantidadeUnidades:
        novoPredio.quantidadeUnidades?.toString().trim() !== ""
          ? Number(novoPredio.quantidadeUnidades)
          : 0, // ou undefined, se preferir deixar opcional
      dataFundacao: novoPredio.dataFundacao?.trim() || undefined,
      cnpj: novoPredio.cnpj?.trim() || undefined,
      nomeSindico: novoPredio.nomeSindico?.trim() || undefined,
      telefoneSindico: novoPredio.telefoneSindico?.trim() || undefined,
      emailSindico: novoPredio.emailSindico?.trim() || undefined,
    };

    try {
      const response = await fetch("/api/predios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setNovoPredio({
          nome: "",
          endereco: "",
          cnpj: "",
          quantidadeUnidades: "",
          dataFundacao: "",
          nomeSindico: "",
          telefoneSindico: "",
          emailSindico: "",
        });
        setShowForm(false);
        carregarPredios();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao criar prédio");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao criar prédio");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleExcluirPredio = async () => {
    if (!predioExcluindo) return;

    try {
      const response = await fetch(`/api/predios/${predioExcluindo.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPredioExcluindo(null);
        carregarPredios();
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao excluir prédio");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao excluir prédio");
    }
  };

  // Cálculos para o overview
  const totalPredios = predios.length;
  const totalUnidades = predios.reduce(
    (sum, predio) => sum + predio._count.unidades,
    0
  );
  const receitaEstimada = 0; // Será calculado quando implementarmos o financeiro

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-verde-esmeralda-50 to-verde-esmeralda-100 flex items-center justify-center">
        <div className="text-verde-esmeralda-600 text-xl">Carregando...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-verde-esmeralda-50 to-verde-esmeralda-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-verde-esmeralda-800 mb-4">
            🌿 Verde Esmeralda
          </h1>
          <p className="text-lg text-verde-esmeralda-600">
            Sistema de Gestão de Condomínios
          </p>
        </div>

        {/* Navegação por Abas */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 font-medium ${
                activeTab === "overview"
                  ? "border-b-2 border-verde-esmeralda-500 text-verde-esmeralda-600"
                  : "text-gray-600 hover:text-verde-esmeralda-600"
              }`}
            >
              📊 Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("predios")}
              className={`px-6 py-3 font-medium ${
                activeTab === "predios"
                  ? "border-b-2 border-verde-esmeralda-500 text-verde-esmeralda-600"
                  : "text-gray-600 hover:text-verde-esmeralda-600"
              }`}
            >
              🏢 Prédios ({totalPredios})
            </button>
            <button
              onClick={() => setActiveTab("financeiro")}
              className={`px-6 py-3 font-medium ${
                activeTab === "financeiro"
                  ? "border-b-2 border-verde-esmeralda-500 text-verde-esmeralda-600"
                  : "text-gray-600 hover:text-verde-esmeralda-600"
              }`}
            >
              💰 Financeiro
            </button>
            <button
              onClick={() => setActiveTab("relatorios")}
              className={`px-6 py-3 font-medium ${
                activeTab === "relatorios"
                  ? "border-b-2 border-verde-esmeralda-500 text-verde-esmeralda-600"
                  : "text-gray-600 hover:text-verde-esmeralda-600"
              }`}
            >
              📈 Relatórios
            </button>
          </div>

          <div className="p-6">
            {/* Aba Overview */}
            {activeTab === "overview" && (
              <div>
                <h2 className="text-2xl font-bold text-verde-esmeralda-800 mb-6">
                  Visão Geral do Sistema
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100">Total de Prédios</p>
                        <p className="text-3xl font-bold">{totalPredios}</p>
                      </div>
                      <div className="text-4xl opacity-80">🏢</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100">Total de Unidades</p>
                        <p className="text-3xl font-bold">{totalUnidades}</p>
                      </div>
                      <div className="text-4xl opacity-80">🏠</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100">Receita Estimada</p>
                        <p className="text-2xl font-bold">Em breve</p>
                      </div>
                      <div className="text-4xl opacity-80">💰</div>
                    </div>
                  </div>
                </div>

                {predios.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏢</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Nenhum prédio cadastrado
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Comece cadastrando seu primeiro prédio para usar o sistema
                    </p>
                    <button
                      onClick={() => setActiveTab("predios")}
                      className="bg-verde-esmeralda-600 text-white px-6 py-3 rounded-lg hover:bg-verde-esmeralda-700"
                    >
                      Cadastrar Primeiro Prédio
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Prédios Recentes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {predios.slice(0, 6).map((predio) => (
                        <Link
                          key={predio.id}
                          href={`/predios/${predio.id}`}
                          className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <h4 className="font-semibold text-verde-esmeralda-800 mb-2">
                            {predio.nome}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {predio.endereco}
                          </p>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              {predio._count.unidades} /{" "}
                              {predio.quantidadeUnidades} unidades
                            </span>
                            {predio.nomeSindico && (
                              <span className="text-verde-esmeralda-600 font-medium">
                                {predio.nomeSindico}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aba Prédios */}
            {activeTab === "predios" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-verde-esmeralda-800">
                    Gestão de Prédios
                  </h2>
                  <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-verde-esmeralda-600 text-white px-4 py-2 rounded-lg hover:bg-verde-esmeralda-700"
                  >
                    {showForm ? "✕ Cancelar" : "+ Novo Prédio"}
                  </button>
                </div>

                {/* Formulário de Novo Prédio */}
                {showForm && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-verde-esmeralda-800 mb-4">
                      Cadastrar Novo Prédio
                    </h3>

                    <PredioForm
                      onSubmit={async (values: PredioFormValues) => {
                        const payload = {
                          ...values,
                          cnpj: values.cnpj?.trim() || undefined,
                          dataFundacao:
                            values.dataFundacao?.trim() || undefined,
                          nomeSindico: values.nomeSindico?.trim() || undefined,
                          telefoneSindico:
                            values.telefoneSindico?.trim() || undefined,
                          emailSindico:
                            values.emailSindico?.trim() || undefined,
                        };

                        const res = await fetch("/api/predios", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(payload),
                        });

                        if (!res.ok) {
                          const err = await res.json().catch(() => ({}));
                          throw new Error(err?.error || "Erro ao criar prédio");
                        }

                        setShowForm(false);
                        await carregarPredios();
                      }}
                      submitLabel="Criar Prédio"
                    />
                  </div>
                )}

                {/* Lista de Prédios */}
                {predios.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏢</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      Nenhum prédio cadastrado
                    </h3>
                    <p className="text-gray-500">
                      Clique em "Novo Prédio" para começar
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {predios.map((predio) => (
                      <div
                        key={predio.id}
                        className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow"
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-xl font-bold text-verde-esmeralda-800">
                              {predio.nome}
                            </h3>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setPredioEditando(predio)}
                                className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm"
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => setPredioExcluindo(predio)}
                                className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 text-sm"
                                title="Excluir"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                            📍 {predio.endereco}
                          </p>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 text-sm">
                                Unidades:
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-verde-esmeralda-700">
                                  {predio._count.unidades}
                                </span>
                                <span className="text-gray-400">/</span>
                                <span className="font-medium text-gray-600">
                                  {predio.quantidadeUnidades}
                                </span>
                              </div>
                            </div>

                            {predio.nomeSindico && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">
                                  Síndico:
                                </span>
                                <span className="font-medium text-verde-esmeralda-600 text-sm">
                                  {predio.nomeSindico}
                                </span>
                              </div>
                            )}

                            {predio.telefoneSindico && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">
                                  Telefone:
                                </span>
                                <span className="font-medium text-gray-600 text-sm">
                                  {predio.telefoneSindico}
                                </span>
                              </div>
                            )}

                            {predio.cnpj && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">
                                  CNPJ:
                                </span>
                                <span className="font-mono text-gray-600 text-xs">
                                  {predio.cnpj}
                                </span>
                              </div>
                            )}

                            {predio.dataFundacao && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">
                                  Fundação:
                                </span>
                                <span className="font-medium text-gray-600 text-sm">
                                  {new Date(
                                    predio.dataFundacao
                                  ).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="border-t pt-4">
                            <Link
                              href={`/predios/${predio.id}`}
                              className="block w-full bg-verde-esmeralda-600 text-white text-center py-2.5 rounded-lg hover:bg-verde-esmeralda-700 font-medium transition-colors"
                            >
                              🏠 Gerenciar Prédio
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Aba Financeiro */}
            {activeTab === "financeiro" && (
              <div>
                <h2 className="text-2xl font-bold text-verde-esmeralda-800 mb-6">
                  Gestão Financeira
                </h2>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Módulo Financeiro
                  </h3>
                  <p className="text-gray-500">
                    Em desenvolvimento - Próxima funcionalidade!
                  </p>
                </div>
              </div>
            )}

            {/* Aba Relatórios */}
            {activeTab === "relatorios" && (
              <div>
                <h2 className="text-2xl font-bold text-verde-esmeralda-800 mb-6">
                  Relatórios
                </h2>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📈</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Módulo de Relatórios
                  </h3>
                  <p className="text-gray-500">
                    Em desenvolvimento - Próxima funcionalidade!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Editar Prédio */}
        {predioEditando && (
          <ModalEditarPredio
            predio={predioEditando}
            onClose={() => setPredioEditando(null)}
            onUpdate={() => {
              carregarPredios();
              setPredioEditando(null);
            }}
          />
        )}

        {/* Modal Excluir Prédio */}
        {predioExcluindo && (
          <ModalConfirmarExclusao
            item={`Prédio "${predioExcluindo.nome}"`}
            onConfirm={handleExcluirPredio}
            onCancel={() => setPredioExcluindo(null)}
          />
        )}
      </div>
    </main>
  );
}
