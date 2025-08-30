/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/_utils.ts
import { NextResponse } from 'next/server'

/**
 * Respostas padronizadas para a API
 * Facilita manutenção e garante consistência
 */

// ============= SUCESSOS =============

/**
 * 200 OK - Requisição bem sucedida
 */
export function ok<T>(data: T) {
  return NextResponse.json(data, { status: 200 })
}

/**
 * 201 Created - Recurso criado com sucesso
 */
export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 })
}

/**
 * 204 No Content - Sucesso sem retorno (ex: DELETE)
 */
export function noContent() {
  return new NextResponse(null, { status: 204 })
}

// ============= ERROS DO CLIENTE =============

/**
 * 400 Bad Request - Dados inválidos
 */
export function bad(message: string, details?: unknown) {
  return NextResponse.json(
    { 
      error: message,
      details: details || undefined 
    },
    { status: 400 }
  )
}

/**
 * 401 Unauthorized - Não autenticado
 */
export function unauthorized(message = 'Não autorizado') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}

/**
 * 403 Forbidden - Sem permissão
 */
export function forbidden(message = 'Acesso negado') {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  )
}

/**
 * 404 Not Found - Recurso não encontrado
 */
export function notFound(message = 'Não encontrado') {
  return NextResponse.json(
    { error: message },
    { status: 404 }
  )
}

/**
 * 409 Conflict - Conflito (ex: duplicação)
 */
export function conflict(message: string) {
  return NextResponse.json(
    { error: message },
    { status: 409 }
  )
}

/**
 * 422 Unprocessable Entity - Validação de negócio falhou
 */
export function unprocessable(message: string, details?: unknown) {
  return NextResponse.json(
    { 
      error: message,
      details: details || undefined 
    },
    { status: 422 }
  )
}

// ============= ERROS DO SERVIDOR =============

/**
 * 500 Internal Server Error - Erro genérico
 */
export function fail(message = 'Erro interno do servidor') {
  console.error(`[API Error] ${message}`)
  return NextResponse.json(
    { error: message },
    { status: 500 }
  )
}

/**
 * 503 Service Unavailable - Serviço indisponível
 */
export function unavailable(message = 'Serviço temporariamente indisponível') {
  return NextResponse.json(
    { error: message },
    { status: 503 }
  )
}

// ============= HELPERS ADICIONAIS =============

/**
 * Trata erros do Prisma de forma amigável
 */
export function handlePrismaError(error: any): NextResponse {
  console.error('[Prisma Error]', error)
  
  // Registro não encontrado
  if (error.code === 'P2025') {
    return notFound('Registro não encontrado')
  }
  
  // Violação de unique constraint
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'campo'
    return conflict(`Já existe um registro com este ${field}`)
  }
  
  // Violação de foreign key
  if (error.code === 'P2003') {
    return bad('Referência inválida')
  }
  
  // Campos obrigatórios faltando
  if (error.code === 'P2011') {
    return bad('Campos obrigatórios não preenchidos')
  }
  
  return fail()
}

/**
 * Valida se é um UUID válido
 */
export function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const cuidRegex = /^c[a-z0-9]{24}$/i // CUID format
  return regex.test(uuid) || cuidRegex.test(uuid)
}

/**
 * Parseia e valida parâmetros de paginação
 */
export interface PaginationParams {
  page: number
  limit: number
  skip: number
}

export function getPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
}

/**
 * Cria resposta paginada
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function paginated<T>(
  data: T[], 
  total: number, 
  params: PaginationParams
): NextResponse {
  const totalPages = Math.ceil(total / params.limit)
  
  const response: PaginatedResponse<T> = {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1
    }
  }
  
  return ok(response)
}

/**
 * Remove campos undefined de objetos
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value
    }
    return acc
  }, {} as Partial<T>)
}

/**
 * Converte string para número de forma segura
 */
export function toNumberSafe(value: any): number | null {
  if (value == null || value === '') return null
  
  // Se já é número
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }
  
  // Se é string, tenta converter (aceita vírgula como decimal)
  if (typeof value === 'string') {
    const cleaned = value.replace(/\./g, '').replace(',', '.')
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : null
  }
  
  return null
}
