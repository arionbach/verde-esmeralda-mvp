import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const predio = await prisma.predio.findUnique({
      where: { id },
      include: { _count: { select: { unidades: true } } },
    });

    if (!predio) {
      return NextResponse.json({ error: "Prédio não encontrado" }, { status: 404 });
    }

    return NextResponse.json(predio);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
