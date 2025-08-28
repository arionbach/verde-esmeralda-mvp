// src/app/api/predios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma' // ajuste se for default export

const BodySchema = z.object({
  nome: z.string().min(2),
  endereco: z.string().min(3),
  quantidadeUnidades: z.coerce.number().int().min(1), // coage "10" -> 10
  cnpj: z.string().trim().optional(),
  dataFundacao: z.string().optional(), // "YYYY-MM-DD"
  nomeSindico: z.string().optional(),
  telefoneSindico: z.string().optional(),
  emailSindico: z.string().email().optional().or(z.literal('')).optional(),
})

const toNull = (s?: string) => (s && s.trim() !== '' ? s.trim() : null)
const toDateOrNull = (s?: string) =>
  !s || s.trim() === '' ? null : new Date(`${s}T00:00:00.000Z`)

export async function GET() {
  try {
    const predios = await prisma.predio.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nome: true,
        endereco: true,
        quantidadeUnidades: true,
        nomeSindico: true,
        _count: { select: { unidades: true } },
      },
    })
    return NextResponse.json(predios)
  } catch (e: any) {
    console.error('GET /api/predios ERROR:', e?.message)
    return NextResponse.json({ error: 'Falha ao listar prédios' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json()
    const body = BodySchema.parse(raw)

    const created = await prisma.predio.create({
      data: {
        nome: body.nome.trim(),
        endereco: body.endereco.trim(),
        quantidadeUnidades: body.quantidadeUnidades,
        cnpj: toNull(body.cnpj),
        dataFundacao: toDateOrNull(body.dataFundacao),
        nomeSindico: toNull(body.nomeSindico),
        telefoneSindico: toNull(body.telefoneSindico),
        emailSindico: toNull(body.emailSindico),
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/predios ERROR:', err?.name, err?.issues ?? err?.message)
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Dados inválidos', issues: err.issues }, { status: 400 })
    }
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'CNPJ já cadastrado' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro interno ao criar prédio' }, { status: 500 })
  }
}
