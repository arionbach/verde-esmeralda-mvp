export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-verde-esmeralda-50 to-verde-esmeralda-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-verde-esmeralda-800 mb-4">
            🌿 Verde Esmeralda MVP
          </h1>
          <p className="text-lg text-verde-esmeralda-600 mb-8">
            Seu projeto está funcionando perfeitamente!
          </p>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-verde-esmeralda-700 mb-3">
              ✅ Configuração Completa
            </h2>
            <ul className="text-left text-verde-esmeralda-600">
              <li>✓ Next.js 15</li>
              <li>✓ TypeScript</li>
              <li>✓ Tailwind CSS</li>
              <li>✓ Prisma ORM</li>
              <li>✓ SQLite Database</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
