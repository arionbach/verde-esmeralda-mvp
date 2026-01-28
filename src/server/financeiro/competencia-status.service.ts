// src/server/financeiro/competencia-status.service.ts
// GOVERNANÇA (ADR‑007 - fechamento de competência)
// - Service responsável por consultar/alterar status de competência por prédio (ABERTA/FECHADA)
// - Auditoria mínima preservada: fechadaEm, fechadaPor (sem alterar schema)
// - Impede fechamento duplicado e reabertura
// - Não realiza cálculos financeiros; foca na governança de status
import { prisma } from '@/lib/prisma'
import { CompetenciaStatusRepository } from '@/server/repositories/CompetenciaStatusRepository'

// Verificação mínima de fechamento operacional (ADR-007)
// Retorna true se a competência (startOfMonth) estiver fechada para o prédio.
export async function isCompetenciaFechada(predioId: string, competencia: Date): Promise<boolean> {
  const row = await CompetenciaStatusRepository.findUnique({
    where: { predioId_competencia: { predioId, competencia } } as any,
    select: { status: true },
  }).catch(() => null)
  return row?.status === 'FECHADA'
}

// Governança: este módulo centraliza o fechamento operacional de competência (ADR-007).
// - Mantém auditoria mínima (fechadaEm, fechadaPor) sem alterar schema.
// - Impede reabertura e fechamento duplicado.
// - Não faz cálculos financeiros.
export async function setCompetenciaStatus(params: {
  predioId: string
  competencia: Date // startOfMonth obrigatório
  status: 'ABERTA' | 'FECHADA'
  usuario: string
}) {
  const { predioId, competencia, status, usuario } = params

  const current = await CompetenciaStatusRepository
    .findUnique({
      where: { predioId_competencia: { predioId, competencia } } as any,
      select: { id: true, status: true, fechadaEm: true, fechadaPor: true },
    })
    .catch(() => null)

  if (current) {
    if (current.status === 'FECHADA' && status === 'FECHADA') {
      throw new Error('Competência já está fechada')
    }
    if (current.status === 'FECHADA' && status === 'ABERTA') {
      // ADR-007: Reabertura não permitida sem deliberação explícita
      throw new Error('Reabertura de competência não permitida')
    }

    const data =
      status === 'FECHADA'
        ? { status, fechadaEm: new Date(), fechadaPor: usuario }
        : { status, fechadaEm: null as Date | null, fechadaPor: null as string | null }

    const row = await CompetenciaStatusRepository.update({
      where: { predioId_competencia: { predioId, competencia } } as any,
      data,
      select: { predioId: true, competencia: true, status: true, fechadaEm: true, fechadaPor: true },
    })
    return row
  }

  const createData =
    status === 'FECHADA'
      ? { status, fechadaEm: new Date(), fechadaPor: usuario }
      : { status, fechadaEm: null as Date | null, fechadaPor: null as string | null }

  const created = await CompetenciaStatusRepository.create({
    data: { predioId, competencia, ...(createData as any) },
    select: { predioId: true, competencia: true, status: true, fechadaEm: true, fechadaPor: true },
  })
  return created
}
