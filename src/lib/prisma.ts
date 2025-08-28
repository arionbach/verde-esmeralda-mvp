// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Evita múltiplas instâncias no hot-reload (Next.js)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ✅ Export default para compatibilizar com imports existentes
export default prisma

/**
 * Testa a conexão sem interferir no cliente compartilhado
 * (usa um cliente efêmero — use com moderação)
 */
export async function testConnection(): Promise<boolean> {
  const tmp = new PrismaClient()
  try {
    await tmp.$connect()
    console.log('✅ Conectado ao PostgreSQL com sucesso!')

    const count = await tmp.predio.count()
    console.log(`📊 Total de prédios no banco: ${count}`)
    return true
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error)
    return false
  } finally {
    await tmp.$disconnect()
  }
}

/**
 * Estatísticas rápidas do banco
 */
export async function getDatabaseStats() {
  try {
    const [predios, unidades, responsaveis] = await Promise.all([
      prisma.predio.count(),
      prisma.unidade.count(),                    // 🔧 removido where { ativo: true } (campo não existe em Unidade)
      prisma.responsavel.count({ where: { ativo: true } }),
    ])

    return {
      healthy: true,
      stats: {
        predios,
        unidades,
        responsaveis,
        timestamp: new Date().toISOString(),
      },
    }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    }
  }
}
