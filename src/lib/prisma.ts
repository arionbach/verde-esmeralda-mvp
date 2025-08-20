// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

// Evita múltiplas instâncias em desenvolvimento (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma

/**
 * Testa a conexão com o banco de dados
 * @returns {Promise<boolean>} true se conectou com sucesso
 */
export async function testConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    console.log('✅ Conectado ao PostgreSQL com sucesso!')
    
    // Testa uma query simples
    const count = await prisma.predio.count()
    console.log(`📊 Total de prédios no banco: ${count}`)
    
    return true
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Verifica saúde do banco e retorna estatísticas
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
      }
    }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    }
  }
}