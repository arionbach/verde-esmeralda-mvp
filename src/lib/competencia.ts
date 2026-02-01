// src/lib/competencia.ts
// Helper consolidado para manipulação de competências financeiras
// Referência: ADR-002 — Competência Mensal como Eixo Temporal
//
// Regras:
// - Competência representa um mês contábil (YYYY-MM)
// - Armazenada normalizada como primeiro dia do mês (startOfMonth)
// - Toda entidade financeira referencia explicitamente uma competência
// - Competência NUNCA muda após criada

import { startOfMonth, endOfMonth, parse, format } from 'date-fns'

/**
 * Resultado do parsing de competência
 */
export interface CompetenciaParsed {
  /** Competência no formato YYYY-MM */
  competenciaStr: string
  /** Primeiro dia do mês (normalizado) */
  inicio: Date
  /** Último dia do mês */
  fim: Date
}

/**
 * Regex para formato YYYY-MM
 */
const COMPETENCIA_REGEX = /^\d{4}-\d{2}$/

/**
 * Valida se uma string está no formato YYYY-MM
 */
export function isValidCompetenciaFormat(competencia: string): boolean {
  return COMPETENCIA_REGEX.test(competencia)
}

/**
 * Parse de competência com validação estrita (formato YYYY-MM obrigatório)
 * 
 * @param competencia - String no formato YYYY-MM
 * @throws Error se formato inválido ou mês inexistente
 * @returns Objeto com competenciaStr, inicio (startOfMonth) e fim (endOfMonth)
 * 
 * @example
 * parseCompetencia('2026-01') // { competenciaStr: '2026-01', inicio: Date, fim: Date }
 * parseCompetencia('2026-1')  // throws Error
 * parseCompetencia('2026-13') // throws Error
 */
export function parseCompetencia(competencia: string): CompetenciaParsed {
  const trimmed = competencia?.trim()?.slice(0, 7)
  
  if (!trimmed || !COMPETENCIA_REGEX.test(trimmed)) {
    throw new Error('Competência inválida. Use formato YYYY-MM')
  }
  
  const parsed = parse(trimmed, 'yyyy-MM', new Date())
  
  if (isNaN(parsed.getTime())) {
    throw new Error('Competência inválida. Use formato YYYY-MM')
  }
  
  // Validar mês (1-12)
  const [, monthStr] = trimmed.split('-')
  const month = parseInt(monthStr, 10)
  if (month < 1 || month > 12) {
    throw new Error('Mês inválido. Use valor entre 01 e 12')
  }
  
  return {
    competenciaStr: trimmed,
    inicio: startOfMonth(parsed),
    fim: endOfMonth(parsed),
  }
}

/**
 * Parse tolerante - aceita variações do formato (ex: 2026-1, 2026-01-15)
 * Extrai os primeiros 7 caracteres e normaliza
 * 
 * @param competencia - String contendo competência
 * @throws Error se não conseguir extrair competência válida
 */
export function parseCompetenciaTolerant(competencia: string): CompetenciaParsed {
  const trimmed = competencia?.trim()
  
  if (!trimmed || trimmed.length < 6) {
    throw new Error('Competência inválida. Use formato YYYY-MM')
  }
  
  // Tenta extrair YYYY-MM do início
  const base = trimmed.slice(0, 7)
  
  // Se não bate com YYYY-MM, tenta parse direto
  if (!COMPETENCIA_REGEX.test(base)) {
    // Tenta parse de ISO date e extrai mês
    const asDate = new Date(trimmed)
    if (!isNaN(asDate.getTime())) {
      const normalized = format(startOfMonth(asDate), 'yyyy-MM')
      return parseCompetencia(normalized)
    }
    throw new Error('Competência inválida. Use formato YYYY-MM')
  }
  
  return parseCompetencia(base)
}

/**
 * Converte Date para string de competência (YYYY-MM)
 */
export function toCompetenciaStr(date: Date): string {
  return format(startOfMonth(date), 'yyyy-MM')
}

/**
 * Normaliza Date para startOfMonth (primeiro dia do mês, 00:00:00)
 */
export function normalizeToStartOfMonth(date: Date): Date {
  return startOfMonth(date)
}

/**
 * Verifica se uma data está dentro de uma competência
 */
export function isWithinCompetencia(date: Date, competencia: string): boolean {
  const { inicio, fim } = parseCompetencia(competencia)
  return date >= inicio && date <= fim
}

/**
 * Gera array de competências entre duas datas
 * 
 * @example
 * getCompetenciaRange('2026-01', '2026-03') // ['2026-01', '2026-02', '2026-03']
 */
export function getCompetenciaRange(from: string, to: string): string[] {
  const { inicio: start } = parseCompetencia(from)
  const { inicio: end } = parseCompetencia(to)
  
  const result: string[] = []
  const current = new Date(start)
  
  while (current <= end) {
    result.push(format(current, 'yyyy-MM'))
    current.setMonth(current.getMonth() + 1)
  }
  
  return result
}

/**
 * Calcula a data de vencimento a partir de competência e dia
 * 
 * @param competencia - String YYYY-MM ou Date (startOfMonth)
 * @param dia - Dia do vencimento (1-28)
 * @returns Date do vencimento
 */
export function calcularVencimento(competencia: string | Date, dia: number): Date {
  const inicio = typeof competencia === 'string' 
    ? parseCompetencia(competencia).inicio 
    : startOfMonth(competencia)
  
  // Garantir dia válido (1-28)
  const diaValido = Math.max(1, Math.min(28, dia))
  
  return new Date(inicio.getFullYear(), inicio.getMonth(), diaValido)
}
