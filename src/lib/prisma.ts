// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Evita múltiplas instâncias no hot-reload (Next.js)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ['query', 'error', 'warn'], // opcional
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Testa a conexão sem interferir no cliente compartilhado
 * (usa um cliente efêmero)
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
    await tmp.$disconnect() // fecha só o cliente efêmero
  }
}

/**
 * Estatísticas rápidas do banco
 */
export async function getDatabaseStats() {
  try {
    const [predios, unidades, responsaveis] = await Promise.all([
      prisma.predio.count(),
      prisma.unidade.count({ where: { ativo: true } }),
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
