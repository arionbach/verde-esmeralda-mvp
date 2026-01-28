// src/server/repositories/CompetenciaStatusRepository.ts
// Repository passivo da entidade CompetenciaStatus (somente chamadas Prisma)
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export const CompetenciaStatusRepository = {
  findUnique: (args: Prisma.CompetenciaStatusFindUniqueArgs) =>
    prisma.competenciaStatus.findUnique(args),
  update: (args: Prisma.CompetenciaStatusUpdateArgs) =>
    prisma.competenciaStatus.update(args),
  create: (args: Prisma.CompetenciaStatusCreateArgs) =>
    prisma.competenciaStatus.create(args),
}

