"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Gera breadcrumbs a partir do pathname e tenta “resolver nomes”:
 * - /predios/[id] -> busca /api/predios/:id para exibir o nome
 * - /predios/[id]/unidades/[unidadeId] -> busca /api/predios/:id/unidades/:unidadeId
 */
export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = useMemo(
    () => pathname.split("/").filter(Boolean),
    [pathname]
  );

  // títulos resolvidos dinamicamente
  const [predioNome, setPredioNome] = useState<string | null>(null);
  const [unidadeTitulo, setUnidadeTitulo] = useState<string | null>(null);

  // tenta resolver nomes quando aplicável
  useEffect(() => {
    const run = async () => {
      setPredioNome(null);
      setUnidadeTitulo(null);

      // /predios/:id(/...)
      const predioIdx = segments.findIndex((s) => s === "predios");
      if (predioIdx >= 0 && segments[predioIdx + 1]) {
        const predioId = segments[predioIdx + 1];
        try {
          const r = await fetch(`/api/predios/${predioId}`);
          if (r.ok) {
            const data = await r.json();
            if (data?.nome) setPredioNome(data.nome);
          }
        } catch {}
      }

      // /predios/:id/unidades/:unidadeId
      const uniIdx = segments.findIndex((s) => s === "unidades");
      if (uniIdx >= 0 && segments[uniIdx + 1]) {
        const predioId =
          predioIdx >= 0 && segments[predioIdx + 1] ? segments[predioIdx + 1] : null;
        const unidadeId = segments[uniIdx + 1];
        if (predioId) {
          try {
            const r = await fetch(
              `/api/predios/${predioId}/unidades/${unidadeId}`
            );
            if (r.ok) {
              const data = await r.json();
              const numero = data?.numero ? `Unidade ${data.numero}` : null;
              setUnidadeTitulo(numero);
            }
          } catch {}
        }
      }
    };
    run();
  }, [segments]);

  // esconder breadcrumb na home
  if (segments.length === 0) return null;

  // mapeia rótulos amigáveis
  const labelMap: Record<string, string> = {
    predios: "Prédios",
    unidades: "Unidades",
    responsaveis: "Responsáveis",
    financeiro: "Financeiro",
    comunicados: "Comunicados",
    relatorios: "Relatórios",
  };

  const items = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    let label = labelMap[seg] ?? seg;

    // substituições “inteligentes”
    const isPredioId =
      idx > 0 && segments[idx - 1] === "predios" && !labelMap[seg];
    const isUnidadeId =
      idx > 0 && segments[idx - 1] === "unidades" && !labelMap[seg];

    if (isPredioId && predioNome) label = predioNome;
    if (isUnidadeId && unidadeTitulo) label = unidadeTitulo;

    // IDs sem resolver → “Detalhes”
    if ((isPredioId || isUnidadeId) && (label === seg || !label)) {
      label = "Detalhes";
    }

    return { href, label, isLast: idx === segments.length - 1 };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="text-sm text-gray-600 py-3 flex items-center gap-2"
    >
      <Link href="/" className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800">
        Home
      </Link>
      {items.map((it, i) => (
        <span key={it.href} className="flex items-center">
          <span className="mx-2 text-gray-300">/</span>
          {it.isLast ? (
            <span className="text-gray-700">{it.label}</span>
          ) : (
            <Link
              href={it.href}
              className="text-verde-esmeralda-600 hover:text-verde-esmeralda-800"
            >
              {it.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
