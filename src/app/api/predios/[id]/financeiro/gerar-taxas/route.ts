// src/app/api/predios/[id]/financeiro/gerar-taxas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma'
import { z } from "zod";

const BodySchema = z.object({
  competencia: z.string(),   // "2025-09-01"
  vencimento: z.string(),    // "2025-09-10"
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const predioId = params.id;
    const body = BodySchema.parse(await req.json());

    const competencia = new Date(body.competencia + "T00:00:00Z");
    const vencimento = new Date(body.vencimento + "T00:00:00Z");

    // Normaliza competencia p/ primeiro dia do mês no DB (a função tb normaliza)
    const [{ inseridos }] = await prisma.$queryRaw<
      Array<{ inseridos: number }>
    >`SELECT public.fn_gerar_taxa_mensal(${predioId}, ${competencia}, ${vencimento}) AS inseridos;`;

    return NextResponse.json({ ok: true, inseridos });
  } catch (err: any) {
    console.error("gerar-taxas", err);
    return NextResponse.json({ ok: false, message: err.message }, { status: 400 });
  }
}
