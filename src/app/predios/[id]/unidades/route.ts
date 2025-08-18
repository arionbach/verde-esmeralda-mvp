//app/api/predios/[id]/unidades/route.ts


import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Esquema de validação para criação de unidade
const CreateUnitSchema = z.object({
  numero: z.string().min(1, "Número é obrigatório"),
  tipo: z.string().optional(),
  metragem: z.number().optional(),
  fracaoIdeal: z.number().optional(),
  valorTaxa: z.number().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const unidades = await prisma.unidade.findMany({
      where: { predioId: params.id },
      include: { responsaveis: true },
      orderBy: { numero: "asc" },
    });

    return NextResponse.json(unidades);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao listar unidades" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const json = await req.json();
    const parse = CreateUnitSchema.safeParse(json);

    if (!parse.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parse.error.flatten() },
        { status: 400 }
      );
    }

    const data = parse.data;

    const unidade = await prisma.unidade.create({
      data: {
        ...data,
        predioId: params.id,
      },
    });

    return NextResponse.json(unidade, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar unidade" },
      { status: 500 }
    );
  }
}
