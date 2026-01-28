// src/agents/core.ts

export type AgentRunMeta = {
  startedAt: string
  durationMs: number
}

export type AgentSuccessResult<T = unknown> = {
  success: true
  data: T
  meta: AgentRunMeta
}

export type AgentErrorResult = {
  success: false
  error: string
  meta: AgentRunMeta
}

export type AgentResult<T = unknown> = AgentSuccessResult<T> | AgentErrorResult

export interface Agent<I, O> {
  name: string
  run(input: I): Promise<AgentResult<O>>
}

