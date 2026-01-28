// src/app/unidades/[id]/FinanceiroTab.server.tsx
// Server wrapper: obtém predioId via Prisma e injeta no componente client
import FinanceiroUnidadeTab from './FinanceiroTab'
import { prisma } from '@/lib/prisma'

export default async function FinanceiroUnidadeTabServer({ unidadeId }: { unidadeId: string }) {
  const u = await prisma.unidade.findUnique({ where: { id: unidadeId }, select: { predioId: true } })
  if (!u?.predioId) {
    return <div className="p-4 text-sm text-red-600">Unidade não encontrada.</div>
  }
  return <FinanceiroUnidadeTab unidadeId={unidadeId} predioId={u.predioId} />
}

