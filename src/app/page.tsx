// src/app/page.tsx - ENCODING CORRIGIDO
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-verde-esmeralda-50 to-verde-esmeralda-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-verde-esmeralda-800 mb-4">
            🌿 Verde Esmeralda MVP
          </h1>
          <p className="text-lg text-verde-esmeralda-600 mb-8">
            Sistema de Gestão de Condomínios
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">🏢</div>
            <h2 className="text-2xl font-semibold text-verde-esmeralda-700 mb-4">
              Gerencie seus Condomínios
            </h2>
            <p className="text-gray-600 mb-8">
              Cadastre prédios, gerencie unidades, controle financeiro e muito mais.
            </p>
            
            <Link
              href="/predios"
              className="inline-block bg-verde-esmeralda-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-verde-esmeralda-700 transition-colors"
            >
              Acessar Prédios
            </Link>
          </div>
          
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-verde-esmeralda-700 mb-3">
              ✅ Sistema Configurado
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-verde-esmeralda-600">
              <div>✓ Next.js 15 + TypeScript</div>
              <div>✓ PostgreSQL + Prisma ORM</div>
              <div>✓ Tailwind CSS</div>
              <div>✓ Schema Multi-Prédios</div>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-verde-esmeralda-700 mb-3">
              🚀 Funcionalidades Disponíveis
            </h3>
            <div className="space-y-2 text-sm text-verde-esmeralda-600">
              <div>✓ Cadastro e gestão de prédios</div>
              <div>✓ Criação de unidades por prédio</div>
              <div>✓ Cadastro de responsáveis (API)</div>
              <div>🚧 Sistema financeiro (em desenvolvimento)</div>
              <div>🚧 Comunicados (em desenvolvimento)</div>
              <div>🚧 Relatórios (em desenvolvimento)</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}