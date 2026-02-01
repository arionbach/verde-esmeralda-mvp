// DEPRECATED: rota antiga; PUT/DELETE oficial em /api/predios ainda a definir
// src/app/api/unidades/[id]/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from '@/lib/prisma'
import { ok, noContent, bad, fail, notFound, conflict } from "../../_utils";
import { Prisma } from "@prisma/client";

const TipoEnum = z.enum(["APARTAMENTO", "COBERTURA", "LOJA", "GARAGEM"]);
const StatusEnum = z.enum(["OCUPADO", "VAZIO", "ALUGADO", "INADIMPLENTE"]);

const toNumNull = z.preprocess((v) => {
  if (v === "" || v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}, z.number().nullable());

const UnidadeUpdateSchema = z.object({
  numero: z.string().min(1),
  tipo: TipoEnum,
  status: StatusEnum,
  metragem: toNumNull,
  fracaoIdeal: toNumNull,
  valorTaxa: toNumNull,
  observacoes: z.string().optional(),
});

type Params = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    console.warn("[DEPRECATED] /api/unidades/:id called", {
      unidadeId: params.id,
      method: "PUT",
      referer: req.headers.get("referer") ?? undefined,
    });
    const body = await req.json();
    const data = UnidadeUpdateSchema.parse(body);

    const unidade = await prisma.unidade.findUnique({
      where: { id: params.id },
      select: { id: true, predioId: true },
    });
    if (!unidade) return notFound("Unidade não encontrada");

    // Tenta atualizar; se número duplicar dentro do mesmo prédio => P2002
    const updated = await prisma.unidade.update({
      where: { id: params.id },
      data: {
        numero: data.numero,
        numeroInt: parseInt(data.numero.replace(/\D/g, '')) || 0,
        tipo: data.tipo,
        status: data.status,
        metragem: data.metragem,
        fracaoIdeal: data.fracaoIdeal,
        valorTaxa: data.valorTaxa === null ? undefined : data.valorTaxa,
        observacoes: data.observacoes ?? null,
      },
    });
    return ok(updated);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return bad("Dados inválidos", err.flatten());
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return conflict("Já existe uma unidade com esse número neste prédio");
    }
    console.error("[unidades/:id.PUT]", err);
    return fail();
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    console.warn("[DEPRECATED] /api/unidades/:id called", {
      unidadeId: params.id,
      method: "DELETE",
      referer: _req.headers.get("referer") ?? undefined,
    });
    const exists = await prisma.unidade.findUnique({ where: { id: params.id } });
    if (!exists) return notFound("Unidade não encontrada");

    await prisma.unidade.update({
      where: { id: params.id },
      data: { ativo: false, deletedAt: new Date() },
    });
    return noContent();
  } catch (err) {
    console.error("[unidades/:id.DELETE]", err);
    return fail();
  }
}

