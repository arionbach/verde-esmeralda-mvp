// src/agents/financeiro/gerar-mensalidades.agent.ts
import { gerarMensalidades } from '@/server/financeiro/financeiro.service'
import type { Agent, AgentResult } from '@/agents/core'

export type GerarMensalidadesInput = {
  predioId: string
  competencia: string
  // string decimal (ex.: "1200,50" ou "1200.50"). Opcional.
  valorPadrao?: string
  // se true, atualiza cobranças existentes na competência
  sobrescrever?: boolean
}

export type GerarMensalidadesOutput = {
  competencia: string
  resumo: { created: number; updated: number; skipped: number; totalUnidades: number }
}

function parseDecimalString(input?: string): number | undefined {
  if (!input) return undefined
  const cleaned = input.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  if (!/^[-+]?\d*(?:\.\d+)?$/.test(cleaned)) return undefined
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : undefined
}

export class GerarMensalidadesAgent implements Agent<GerarMensalidadesInput, GerarMensalidadesOutput> {
  name = 'financeiro.gerar-mensalidades'

  async run(input: GerarMensalidadesInput): Promise<AgentResult<GerarMensalidadesOutput>> {
    const started = Date.now()
    try {
      const valorNum = parseDecimalString(input.valorPadrao)
      const result = await gerarMensalidades(input.predioId, input.competencia, {
        valorPadrao: valorNum,
        sobrescrever: !!input.sobrescrever,
      })

      return {
        success: true,
        data: result,
        meta: { startedAt: new Date(started).toISOString(), durationMs: Date.now() - started },
      }
    } catch (e: any) {
      const message = e?.message || 'Falha ao gerar mensalidades'
      return {
        success: false,
        error: message,
        meta: { startedAt: new Date(started).toISOString(), durationMs: Date.now() - started },
      }
    }
  }
}
