// src/app/api/predios/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET - Lista todos os prédios
export async function GET(_req: NextRequest) {
  try {
    const predios = await prisma.predio.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { unidades: true } },
      },
    });

    return NextResponse.json(predios);
  } catch (error) {
    console.error("Erro ao listar prédios:", error);
    return NextResponse.json(
      { error: "Erro interno ao listar prédios" },
      { status: 500 }
    );
  }
}

// POST - Cria um novo prédio
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.nome) {
      return NextResponse.json(
        { error: "O campo 'nome' é obrigatório" },
        { status: 400 }
      );
    }

    const novoPredio = await prisma.predio.create({
      data: {
        nome: data.nome,
        endereco: data.endereco ?? null,
        cnpj: data.cnpj ?? null,
        quantidadeUnidades: Number(data.quantidadeUnidades) || 0,
        dataFundacao: data.dataFundacao
          ? new Date(data.dataFundacao)
          : null,
        nomeSindico: data.nomeSindico ?? null,
        telefoneSindico: data.telefoneSindico ?? null,
        emailSindico: data.emailSindico ?? null,
      },
    });

    return NextResponse.json(novoPredio, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar prédio:", error);
    return NextResponse.json(
      { error: "Erro interno ao criar prédio" },
      { status: 500 }
    );
  }
}
