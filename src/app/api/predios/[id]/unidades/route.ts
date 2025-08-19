// src/app/api/predios/[id]/unidades/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

// validação de entrada (create)
const UnidadeCreateSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório').transform(s => s.trim()),
  tipo: z.enum(['apartamento', 'cobertura', 'loja', 'garagem']),
  metragem: z.number().positive().nullable().optional(),
  fracaoIdeal: z.number().min(0).max(100).nullable().optional(),
  valorTaxa: z.number().min(0).default(0),
  status: z.enum(['ocupado', 'vazio']),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const predioId = params.id
  try {
    // garante prédio existente (evita responder 200 vazios para id inválido)
    const predio = await prisma.predio.findUnique({ where: { id: predioId }, select: { id: true } })
    if (!predio) return NextResponse.json({ error: 'Prédio não encontrado' }, { status: 404 })

    const unidades = await prisma.unidade.findMany({
      where: { predioId },
      include: {
        responsaveis: true, // pode filtrar por ativo no futuro, hoje o front faz a escolha
      },
      orderBy: [{ numero: 'asc' }],
    })
    return NextResponse.json(unidades)
  } catch (e) {
    console.error('[UNIDADES][GET] erro:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const predioId = params.id
  try {
    const body = await req.json()
    const parsed = UnidadeCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    // prédio existe?
    const predio = await prisma.predio.findUnique({ where: { id: predioId }, select: { id: true } })
    if (!predio) return NextResponse.json({ error: 'Prédio não encontrado' }, { status: 404 })

    // duplicidade (mesmo número no mesmo prédio)
    const existe = await prisma.unidade.findFirst({
      where: { predioId, numero: data.numero },
      select: { id: true },
    })
    if (existe) {
      return NextResponse.json(
        { error: 'Já existe uma unidade com este número neste prédio.' },
        { status: 409 } // <- o front trata esse 409 especificamente:contentReference[oaicite:12]{index=12}
      )
    }

    // coerência mínima status x responsável (no create não há responsável ainda)
    // se vier "vazio": ok; se vier "ocupado": aceitaremos (responsável pode ser cadastrado em seguida)

    const created = await prisma.unidade.create({
      data: {
        predioId,
        numero: data.numero,
        tipo: data.tipo,
        metragem: data.metragem ?? null,
        fracaoIdeal: data.fracaoIdeal ?? null,
        valorTaxa: data.valorTaxa ?? 0,
        status: data.status,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    console.error('[UNIDADES][POST] erro:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
