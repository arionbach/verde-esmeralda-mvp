// src/domain/unidades.ts
import { UnidadeTipo, UnidadeStatus, ResponsavelTipo } from '@prisma/client'

// Mapeamentos auxiliares
const TIPO_UI_MAP: Record<string, string> = {
  APARTAMENTO: 'apartamento',
  COBERTURA: 'cobertura',
  LOJA: 'loja',
  GARAGEM: 'garagem',
}

const STATUS_UI_MAP: Record<string, string> = {
  OCUPADO: 'ocupado',
  VAZIO: 'vazio',
}

const TIPO_LABEL_MAP: Record<string, string> = {
  apartamento: 'Apartamento',
  cobertura: 'Cobertura',
  loja: 'Loja',
  garagem: 'Garagem',
}

const RESPONSAVEL_LABEL_MAP: Record<string, string> = {
  proprietario: 'Proprietário',
  inquilino: 'Inquilino',
  PROPRIETARIO: 'Proprietário',
  INQUILINO: 'Inquilino',
}

// Converte entradas variadas para enums do Prisma
export function toUnidadeTipoEnum(v: unknown): UnidadeTipo {
  const s = String(v ?? '').trim()
  if (!s) return UnidadeTipo.APARTAMENTO
  const upper = s.toUpperCase()
  switch (upper) {
    case 'APARTAMENTO':
      return UnidadeTipo.APARTAMENTO
    case 'COBERTURA':
      return UnidadeTipo.COBERTURA
    case 'LOJA':
      return UnidadeTipo.LOJA
    case 'GARAGEM':
      return UnidadeTipo.GARAGEM
    default: {
      // aceitar pt-br minúsculo do front
      const viaUi = TIPO_UI_MAP[upper]
      if (viaUi) return UnidadeTipo[upper as keyof typeof UnidadeTipo]
      const uiLower = s.toLowerCase()
      if (uiLower in TIPO_LABEL_MAP) {
        switch (uiLower) {
          case 'apartamento':
            return UnidadeTipo.APARTAMENTO
          case 'cobertura':
            return UnidadeTipo.COBERTURA
          case 'loja':
            return UnidadeTipo.LOJA
          case 'garagem':
            return UnidadeTipo.GARAGEM
        }
      }
      return UnidadeTipo.APARTAMENTO
    }
  }
}

export function toUnidadeStatusEnum(v: unknown): UnidadeStatus {
  const s = String(v ?? '').trim()
  if (!s) return UnidadeStatus.VAZIO
  const upper = s.toUpperCase()
  switch (upper) {
    case 'OCUPADO':
      return UnidadeStatus.OCUPADO
    case 'VAZIO':
      return UnidadeStatus.VAZIO
    default: {
      const lower = s.toLowerCase()
      if (lower === 'ocupado') return UnidadeStatus.OCUPADO
      if (lower === 'vazio') return UnidadeStatus.VAZIO
      return UnidadeStatus.VAZIO
    }
  }
}

export function toResponsavelTipoEnum(v: unknown): ResponsavelTipo {
  const s = String(v ?? '').trim()
  if (!s) return ResponsavelTipo.PROPRIETARIO
  const upper = s.toUpperCase()
  if (upper === 'PROPRIETARIO') return ResponsavelTipo.PROPRIETARIO
  if (upper === 'INQUILINO') return ResponsavelTipo.INQUILINO
  const lower = s.toLowerCase()
  if (lower === 'proprietario') return ResponsavelTipo.PROPRIETARIO
  if (lower === 'inquilino') return ResponsavelTipo.INQUILINO
  return ResponsavelTipo.PROPRIETARIO
}

// Normalização para UI
export function normalizeUnidadeTipoToUi(v: string | UnidadeTipo | undefined): string {
  if (!v) return 'apartamento'
  const key = typeof v === 'string' ? v : String(v)
  const upper = key.toUpperCase()
  if (upper in TIPO_UI_MAP) return TIPO_UI_MAP[upper]
  const lower = key.toLowerCase()
  return TIPO_UI_MAP[lower.toUpperCase()] || lower
}

export function normalizeUnidadeStatusToUi(v: string | UnidadeStatus | undefined): string {
  if (!v) return 'vazio'
  const key = typeof v === 'string' ? v : String(v)
  const upper = key.toUpperCase()
  if (upper in STATUS_UI_MAP) return STATUS_UI_MAP[upper]
  const lower = key.toLowerCase()
  return STATUS_UI_MAP[lower.toUpperCase()] || lower
}

// Labels amigáveis
export function getUnidadeTipoLabel(v: string | UnidadeTipo): string {
  const ui = normalizeUnidadeTipoToUi(v)
  return TIPO_LABEL_MAP[ui] || ui
}

export function getResponsavelTipoLabel(v: string | ResponsavelTipo): string {
  const key = typeof v === 'string' ? v : String(v)
  return RESPONSAVEL_LABEL_MAP[key] || RESPONSAVEL_LABEL_MAP[key.toLowerCase()] || key
}
