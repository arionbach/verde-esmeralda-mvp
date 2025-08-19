import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma

// Função para testar conexão
export async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Conectado ao PostgreSQL com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro ao conectar:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}