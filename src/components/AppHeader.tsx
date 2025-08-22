"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Visão Geral", icon: "📊" },
  { href: "/predios", label: "Prédios", icon: "🏢" },
  // você pode habilitar quando existir
  // { href: "/responsaveis", label: "Responsáveis", icon: "👥" },
  // { href: "/config", label: "Configurações", icon: "⚙️" },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/80 border-b border-emerald-100">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Marca */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <div className="leading-tight">
              <div className="text-xl font-bold text-verde-esmeralda-800">
                Verde Esmeralda
              </div>
              <div className="text-xs text-emerald-700/70">
                Sistema de Gestão de Condomínios
              </div>
            </div>
          </Link>

          {/* Navegação primária */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-verde-esmeralda-600 text-white shadow"
                      : "text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Perfil/ações (placeholder) */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-sm text-gray-500">
              v0.1 • MVP
            </div>
            <button
              className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 font-semibold"
              title="Perfil"
            >
              AE
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
