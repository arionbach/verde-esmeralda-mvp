// src/agents/financeiro/runner.ts
// Placeholder para futuras preocupações transversais (logs, idempotência distribuída, retries).
// Não utilizado por enquanto, mas reservado para padronizar execução de agentes no futuro.

export type Runner = <I, O>(fn: (input: I) => Promise<O>) => (input: I) => Promise<O>

export const passthroughRunner: Runner = (fn) => async (input) => fn(input)

