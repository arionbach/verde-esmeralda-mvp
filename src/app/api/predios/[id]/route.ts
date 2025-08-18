// src/app/api/predios/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // 👈 params é Promise
) {
  try {
    const { id } = await ctx.params; // 👈 aguarda antes de usar

    const predio = await prisma.predio.findUnique({
      where: { id },
      include: { _count: { select: { unidades: true } } },
    });

    if (!predio) {
      return NextResponse.json({ error: "Prédio não encontrado" }, { status: 404 });
    }

    return NextResponse.json(predio);
  } catch (e) {
    console.error("Erro ao carregar prédio:", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
