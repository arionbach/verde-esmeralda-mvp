import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const UnidadeSchema = z.object({
  numero: z.string().min(1, 'Número é obrigatório'),
  tipo: z.enum(['apartamento', 'cobertura', 'loja', 'garagem']).default('apartamento'),
  metragem: z.coerce.number().optional(),
  fracaoIdeal: z.coerce.number().optional(),
  status: z.enum(['ocupado', 'vazio']).default('ocupado'),
  valorTaxa: z.coerce.number().min(0).default(0),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const predio = await prisma.predio.findUnique({ where: { id: params.id } });
    if (!predio) return NextResponse.json({ error: 'Prédio não encontrado' }, { status: 404 });

    const unidades = await prisma.unidade.findMany({
      where: { predioId: params.id },
      include: {
        responsaveis: { where: { ativo: true }, select: { id: true, nome: true, tipo: true, telefone: true, email: true } },
        pagamentos: { where: { status: 'pendente' }, select: { id: true } },
      },
      orderBy: [{ numero: 'asc' }],
    });

    return NextResponse.json(unidades.map(u => ({ ...u, pendenciasCount: u.pagamentos.length })));
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const data = UnidadeSchema.parse(body);

    const predio = await prisma.predio.findUnique({ where: { id: params.id } });
    if (!predio) return NextResponse.json({ error: 'Prédio não encontrado' }, { status: 404 });

    // requer @@unique([predioId, numero]) no model Unidade
    const existente = await prisma.unidade.findUnique({
      where: { predioId_numero: { predioId: params.id, numero: data.numero } },
    });
    if (existente) {
      return NextResponse.json({ error: 'Já existe uma unidade com este número neste prédio' }, { status: 409 });
    }

    const unidade = await prisma.unidade.create({
      data: { ...data, predioId: params.id },
      include: {
        responsaveis: { where: { ativo: true } },
        pagamentos: { where: { status: 'pendente' }, select: { id: true } },
      },
    });

    return NextResponse.json({ ...unidade, pendenciasCount: unidade.pagamentos.length }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    console.error('Erro ao criar unidade:', error);
    return NextResponse.json({ error: 'Erro ao criar unidade' }, { status: 500 });
  }
}
