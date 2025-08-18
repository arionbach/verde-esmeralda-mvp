// src/app/api/predios/[id]/unidades/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const UnidadeSchema = z.object({
  numero: z.string().min(1, "Número é obrigatório"),
  tipo: z.enum(["apartamento", "cobertura", "loja", "garagem"]).default("apartamento"),
  metragem: z.coerce.number().optional(),
  fracaoIdeal: z.coerce.number().optional(),
  status: z.enum(["ocupado", "vazio"]).default("ocupado"),
  valorTaxa: z.coerce.number().min(0).default(0),
});

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // 👈 Promise
) {
  try {
    const { id: predioId } = await ctx.params; // 👈 await

    const predio = await prisma.predio.findUnique({ where: { id: predioId } });
    if (!predio) {
      return NextResponse.json({ error: "Prédio não encontrado" }, { status: 404 });
    }

    const unidades = await prisma.unidade.findMany({
      where: { predioId },
      include: {
        responsaveis: {
          where: { ativo: true },
          select: { id: true, nome: true, tipo: true, telefone: true, email: true },
        },
        pagamentos: { where: { status: "pendente" }, select: { id: true } },
      },
      orderBy: [{ numero: "asc" }],
    });

    const unidadesComPendencias = unidades.map((u) => ({
      ...u,
      pendenciasCount: u.pagamentos.length,
    }));

    return NextResponse.json(unidadesComPendencias);
  } catch (error) {
    console.error("Erro ao buscar unidades:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // 👈 Promise
) {
  try {
    const { id: predioId } = await ctx.params; // 👈 await
    const body = await req.json();

    const validated = UnidadeSchema.parse(body);

    const predio = await prisma.predio.findUnique({ where: { id: predioId } });
    if (!predio) {
      return NextResponse.json({ error: "Prédio não encontrado" }, { status: 404 });
    }

    // Requer @@unique([predioId, numero]) no schema da Unidade
    const unidadeExistente = await prisma.unidade.findUnique({
      where: { predioId_numero: { predioId, numero: validated.numero } },
    });
    if (unidadeExistente) {
      return NextResponse.json(
        { error: "Já existe uma unidade com este número neste prédio" },
        { status: 409 }
      );
    }

    const unidade = await prisma.unidade.create({
      data: { ...validated, predioId },
      include: {
        responsaveis: { where: { ativo: true } },
        pagamentos: { where: { status: "pendente" }, select: { id: true } },
      },
    });

    const result = { ...unidade, pendenciasCount: unidade.pagamentos.length };
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Erro ao criar unidade:", error);
    return NextResponse.json({ error: "Erro ao criar unidade" }, { status: 500 });
  }
}
