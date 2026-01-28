// src/app/api/agents/financeiro/mensalidades/route.ts
import { NextRequest } from 'next/server'
import { ok, bad, fail } from '@/app/api/_utils'
import { GerarMensalidadesAgent } from '@/agents/financeiro/gerar-mensalidades.agent'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Não validar/parsing aqui: apenas orquestrar e repassar entrada bruta
    const { predioId, competencia, valorPadrao, sobrescrever } = body ?? {}

    const agent = new GerarMensalidadesAgent()
    const result = await agent.run({ predioId, competencia, valorPadrao, sobrescrever })

    if (result.success) {
      return ok(result.data)
    }
    return bad(result.error)
  } catch (e: any) {
    // Entrada não JSON ou erro inesperado
    const msg = e?.message || 'Erro ao processar requisição do agente'
    return fail(msg)
  }
}

