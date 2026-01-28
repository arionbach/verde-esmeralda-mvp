// src/server/repositories/PagamentoRepository.ts
// R.1 snapshot: este repository expõe APENAS operações usadas nos services financeiros
// no momento da refatoração R.1. Novos usos exigem revisão arquitetural explícita.
// Repository passivo da entidade Pagamento (somente chamadas Prisma, sem lógica).
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const PagamentoRepository = {
  findFirst: (args: Prisma.PagamentoFindFirstArgs) => prisma.pagamento.findFirst(args),
  findUnique: (args: Prisma.PagamentoFindUniqueArgs) => prisma.pagamento.findUnique(args),
  findMany: (args: Prisma.PagamentoFindManyArgs) => prisma.pagamento.findMany(args),
  create: (args: Prisma.PagamentoCreateArgs) => prisma.pagamento.create(args),
  createMany: (args: Prisma.PagamentoCreateManyArgs) => prisma.pagamento.createMany(args),
  update: (args: Prisma.PagamentoUpdateArgs) => prisma.pagamento.update(args),
  updateMany: (args: Prisma.PagamentoUpdateManyArgs) => prisma.pagamento.updateMany(args),
  // groupBy não possui tipo gerado estável em Prisma Client; usa assinatura do client
  groupBy: (args: Prisma.PagamentoGroupByArgs) => (prisma as any).pagamento.groupBy(args),
  aggregate: (args: Prisma.PagamentoAggregateArgs) => prisma.pagamento.aggregate(args),
}
