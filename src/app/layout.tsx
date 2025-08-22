import "./globals.css";
import { Inter } from "next/font/google";
import AppHeader from "../components/AppHeader";
import Breadcrumbs from "../components/Breadcrumbs";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Verde Esmeralda MVP",
  description: "Sistema de Gestão de Condomínios",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} suppressHydrationWarning>
        {/* Topo fixo do app */}
        <div className="bg-gradient-to-b from-verde-esmeralda-50 to-transparent">
          <AppHeader />
        </div>

        {/* Trilha de navegação */}
        <div className="container mx-auto px-4">
          <Breadcrumbs />
        </div>

        {/* Conteúdo */}
        <main className="min-h-screen">
          <div className="container mx-auto px-4 py-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
