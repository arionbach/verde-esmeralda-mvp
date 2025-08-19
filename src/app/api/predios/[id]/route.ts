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

// UPDATE (editar prédio)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const predio = await prisma.predio.update({
      where: { id: params.id },
      data: {
        nome: body.nome,
        endereco: body.endereco,
        cnpj: body.cnpj ?? null,
        quantidadeUnidades: body.quantidadeUnidades ? Number(body.quantidadeUnidades) : undefined,
        dataFundacao: body.dataFundacao ? new Date(body.dataFundacao) : undefined,
        nomeSindico: body.nomeSindico ?? null,
        telefoneSindico: body.telefoneSindico ?? null,
        emailSindico: body.emailSindico ?? null,
      },
    })
    return NextResponse.json(predio)
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao atualizar prédio' }, { status: 500 })
  }
}

// DELETE (excluir prédio + filhos)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.$transaction([
      prisma.responsavel.deleteMany({ where: { unidade: { predioId: params.id } } }),
      // se tiver outros filhos (pagamentos/manutenções), deleteMany aqui
      prisma.unidade.deleteMany({ where: { predioId: params.id } }),
      prisma.predio.delete({ where: { id: params.id } }),
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Não foi possível excluir o prédio' }, { status: 500 })
  }
}

