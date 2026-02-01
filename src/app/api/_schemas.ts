// src/app/api/_schemas.ts
import { z } from 'zod'
import { 
  UnidadeTipo, 
  UnidadeStatus, 
  ResponsavelTipo,
  PagamentoTipo,
  PagamentoStatus,
  ManutencaoStatus 
} from '@prisma/client'

/**
 * Schemas de validação para todas as entidades
 * Garante que os dados chegam corretos na API
 */

// ============= HELPERS =============

/**
 * Converte string para número, aceita vírgula como decimal
 */
const toNumber = z.preprocess((val) => {
  if (val === '' || val == null) return undefined
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const cleaned = val.replace(/\./g, '').replace(',', '.')
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : undefined
  }
  return undefined
}, z.number().optional())

/**
 * Converte string para número ou null
 */
const toNumberNullable = z.preprocess((val) => {
  if (val === '' || val == null) return null
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const cleaned = val.replace(/\./g, '').replace(',', '.')
    const num = Number(cleaned)
    return Number.isFinite(num) ? num : null
  }
  return null
}, z.number().nullable())

/**
 * Converte string para data
 */
const toDate = z.preprocess((val) => {
  if (!val) return undefined
  if (val instanceof Date) return val
  if (typeof val === 'string') {
    const date = new Date(val)
    return isNaN(date.getTime()) ? undefined : date
  }
  return undefined
}, z.date().optional())

/**
 * Converte string para data ou null
 */
const toDateNullable = z.preprocess((val) => {
  if (!val) return null
  if (val instanceof Date) return val
  if (typeof val === 'string') {
    const date = new Date(val)
    return isNaN(date.getTime()) ? null : date
  }
  return null
}, z.date().nullable())

/**
 * Normaliza enum para maiúsculo (compatível com Prisma)
 */
const normalizeEnum = <T extends string>(enumObj: Record<string, T>) => {
  return z.preprocess((val) => {
    if (!val) return undefined
    const upper = String(val).toUpperCase()
    return Object.values(enumObj).includes(upper as T) ? upper : undefined
  }, z.nativeEnum(enumObj))
}

// ============= PRÉDIO =============

export const PredioCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  endereco: z.string().min(1, 'Endereço é obrigatório').max(200),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ inválido').optional().nullable(),
  quantidadeUnidades: toNumber.pipe(z.number().int().positive('Quantidade deve ser maior que zero')),
  dataFundacao: toDateNullable,
  nomeSindico: z.string().max(100).optional().nullable(),
  telefoneSindico: z.string().max(20).optional().nullable(),
  emailSindico: z.string().email('Email inválido').optional().nullable(),
})

export const PredioUpdateSchema = PredioCreateSchema.partial()

// ============= UNIDADE =============

export const UnidadeCreateSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório').max(20),
  tipo: normalizeEnum(UnidadeTipo).default(UnidadeTipo.APARTAMENTO),
  metragem: toNumberNullable,
  fracaoIdeal: toNumberNullable,
  status: normalizeEnum(UnidadeStatus).default(UnidadeStatus.VAZIO),
  valorTaxa: toNumber.pipe(z.number().nonnegative('Valor não pode ser negativo')).default(0),
})

export const UnidadeUpdateSchema = UnidadeCreateSchema.partial()

// ============= RESPONSÁVEL =============

export const ResponsavelCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido').max(18),
  telefone: z.string().max(20).optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  tipo: normalizeEnum(ResponsavelTipo).default(ResponsavelTipo.PROPRIETARIO),
  ehTitularCobranca: z.boolean().default(false),
  dataInicio: toDate.pipe(z.date()).default(() => new Date()),
  dataFim: toDateNullable,
  ativo: z.boolean().default(true),
})

export const ResponsavelUpdateSchema = ResponsavelCreateSchema.partial()

// ============= MANUTENÇÃO =============

export const ManutencaoCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().max(500).optional().nullable(),
  valorTotal: toNumber.pipe(z.number().positive('Valor deve ser maior que zero')),
  numeroParcelas: z.number().int().min(1).max(60),
  dataInicio: toDate.pipe(z.date()).default(() => new Date()),
  dataFim: toDateNullable,
  status: normalizeEnum(ManutencaoStatus).default(ManutencaoStatus.ATIVA),
})

export const ManutencaoUpdateSchema = ManutencaoCreateSchema.partial()

// ============= PAGAMENTO =============

export const PagamentoCreateSchema = z.object({
  unidadeId: z.string().cuid(),
  tipo: normalizeEnum(PagamentoTipo),
  valor: toNumber.pipe(z.number().positive('Valor deve ser maior que zero')),
  competencia: toDateNullable,
  dataVencimento: toDate.pipe(z.date()),
  dataPagamento: toDateNullable,
  status: normalizeEnum(PagamentoStatus).default(PagamentoStatus.PENDENTE),
  numeroParcela: z.number().int().optional().nullable(),
  manutencaoId: z.string().cuid().optional().nullable(),
  observacao: z.string().max(500).optional().nullable(),
})

export const PagamentoUpdateSchema = z.object({
  dataPagamento: toDateNullable,
  status: normalizeEnum(PagamentoStatus),
  observacao: z.string().max(500).optional().nullable(),
})

// ============= COMUNICADO =============

export const ComunicadoCreateSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(100),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório').max(2000),
  dataPublicacao: toDate.pipe(z.date()).default(() => new Date()),
  ativo: z.boolean().default(true),
})

export const ComunicadoUpdateSchema = ComunicadoCreateSchema.partial()

// ============= DESPESA FIXA =============

export const DespesaFixaCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  valor: toNumber.pipe(z.number().positive('Valor deve ser maior que zero')),
  diaVencimento: z.coerce.number().int().min(1).max(28),
  categoria: z.string().max(50).optional().nullable(),
  dataInicio: toDate.optional(),
  dataFim: toDateNullable,
  ativo: z.boolean().default(true),
})

export const DespesaFixaUpdateSchema = DespesaFixaCreateSchema.partial()

// ============= FILTROS E QUERIES =============

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  orderBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
})

export const DateRangeSchema = z.object({
  dataInicio: toDate,
  dataFim: toDate,
}).refine(
  (data) => !data.dataInicio || !data.dataFim || data.dataInicio <= data.dataFim,
  { message: 'Data inicial deve ser anterior à data final' }
)

// ============= TIPOS EXPORTADOS =============

export type PredioCreateInput = z.infer<typeof PredioCreateSchema>
export type PredioUpdateInput = z.infer<typeof PredioUpdateSchema>
export type UnidadeCreateInput = z.infer<typeof UnidadeCreateSchema>
export type UnidadeUpdateInput = z.infer<typeof UnidadeUpdateSchema>
export type ResponsavelCreateInput = z.infer<typeof ResponsavelCreateSchema>
export type ResponsavelUpdateInput = z.infer<typeof ResponsavelUpdateSchema>
export type ManutencaoCreateInput = z.infer<typeof ManutencaoCreateSchema>
export type ManutencaoUpdateInput = z.infer<typeof ManutencaoUpdateSchema>
export type PagamentoCreateInput = z.infer<typeof PagamentoCreateSchema>
export type PagamentoUpdateInput = z.infer<typeof PagamentoUpdateSchema>
export type ComunicadoCreateInput = z.infer<typeof ComunicadoCreateSchema>
export type ComunicadoUpdateInput = z.infer<typeof ComunicadoUpdateSchema>
export type PaginationInput = z.infer<typeof PaginationSchema>
export type DateRangeInput = z.infer<typeof DateRangeSchema>
export type DespesaFixaCreateInput = z.infer<typeof DespesaFixaCreateSchema>
export type DespesaFixaUpdateInput = z.infer<typeof DespesaFixaUpdateSchema>

// ============= VALIDADORES ÚTEIS =============

/**
 * Valida CPF com algoritmo completo (dígitos verificadores)
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  
  // Rejeita CPFs com todos dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleaned)) return false
  
  // Calcula primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned[9])) return false
  
  // Calcula segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned[10])) return false
  
  return true
}

/**
 * Valida CNPJ com algoritmo completo (dígitos verificadores)
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return false
  
  // Rejeita CNPJs com todos dígitos iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false
  
  // Pesos para cálculo dos dígitos verificadores
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  
  // Calcula primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i]
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  if (digit1 !== parseInt(cleaned[12])) return false
  
  // Calcula segundo dígito verificador
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i]
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder
  if (digit2 !== parseInt(cleaned[13])) return false
  
  return true
}

/**
 * Valida CPF ou CNPJ automaticamente pelo tamanho
 */
export function isValidCpfCnpj(value: string): boolean {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 11) return isValidCPF(cleaned)
  if (cleaned.length === 14) return isValidCNPJ(cleaned)
  return false
}

/**
 * Formata moeda para salvar no banco (Decimal)
 */
export function currencyToDecimal(value: string | number): number {
  if (typeof value === 'number') return value
  
  // Remove R$, pontos e troca vírgula por ponto
  const cleaned = value
    .replace(/R\$/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()
  
  return parseFloat(cleaned) || 0
}
