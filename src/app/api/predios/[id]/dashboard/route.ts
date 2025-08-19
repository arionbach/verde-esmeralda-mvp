// src/app/api/predios/[id]/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

type DashboardData = {
  totalUnidades: number
  unidadesOcupadas: number
  unidadesVazias: number
  inadimplentes: number
  receitaMensalPrevista: number
  receitaMensalRecebida: number
  ultimasUnidades: Array<{
    id: string
    numero: string
    bloco?: string | null
    createdAt?: Date | null
    responsavel?: { id: string; nome: string } | null
  }>
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const predioId = params.id

  try {
    // 1) Verifica se o prédio existe
    const predio = await prisma.predio.findUnique({
      where: { id: predioId },
      select: { id: true }
    })
    if (!predio) {
      return NextResponse.json(
        { error: 'Prédio não encontrado' },
        { status: 404 }
      )
    }

    // 2) Carrega unidades do prédio com responsáveis ativos e pagamentos pendentes
    const unidades = await prisma.unidade.findMany({
      where: { predioId },
      include: {
        responsaveis: {
          where: { ativo: true },
          select: { id: true, nome: true }
        },
        pagamentos: {
          where: { status: 'pendente' },
          select: { id: true }
        }
      },
      orderBy: { numero: 'asc' }
    })

    // 3) Métricas básicas
    const totalUnidades = unidades.length

    // Considera ocupada se tem responsável ativo OU status marcado como ocupada/ocupado
    const unidadesOcupadas = unidades.filter(u =>
      (u as any).status?.toString().toUpperCase().includes('OCUP') || // 'OCUPADA' / 'OCUPADO'
      (u as any).status?.toString().toUpperCase() === 'OCUPADO' ||
      (u as any).status?.toString().toUpperCase() === 'OCUPADA' ||
      (u.responsaveis?.length ?? 0) > 0
    ).length

    const unidadesVazias = totalUnidades - unidadesOcupadas

    // Inadimplentes: unidades que possuem pelo menos 1 pagamento pendente
    const inadimplentes = unidades.filter(u => (u.pagamentos?.length ?? 0) > 0).length

    // Receita prevista do mês: soma das taxas configuradas nas unidades (fallback para 0)
    const receitaMensalPrevista = unidades.reduce((sum, u) => {
      const taxa = Number((u as any).valorTaxa ?? 0)
      return sum + (isFinite(taxa) ? taxa : 0)
    }, 0)

    // 4) Receita recebida no mês corrente (pagamentos status 'pago' dentro do mês)
    const now = new Date()
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
    const inicioProxMes = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Busca apenas pagamentos do prédio (via relação por unidade) quitados no mês
    const pagosNoMes = await prisma.pagamento.findMany({
      where: {
        status: 'pago',
        dataPagamento: { gte: inicioMes, lt: inicioProxMes },
        unidade: { predioId }
      },
      select: { valor: true }
    })

    const receitaMensalRecebida = pagosNoMes.reduce((sum, p: any) => {
      const v = Number(p.valor ?? 0)
      return sum + (isFinite(v) ? v : 0)
    }, 0)

    // 5) Últimas 5 unidades cadastradas (com responsável ativo)
    const ultimas = await prisma.unidade.findMany({
      where: { predioId },
      include: {
        responsaveis: {
          where: { ativo: true },
          select: { id: true, nome: true }
        }
      },
      orderBy: [{ createdAt: 'desc' }, { numero: 'asc' }],
      take: 5
    })

    const ultimasUnidades = ultimas.map(u => ({
      id: u.id,
      numero: (u as any).numero,
      bloco: (u as any).bloco ?? null,
      createdAt: (u as any).createdAt ?? null,
      responsavel: u.responsaveis[0] ? { id: u.responsaveis[0].id, nome: u.responsaveis[0].nome } : null
    }))

    const payload: DashboardData = {
      totalUnidades,
      unidadesOcupadas,
      unidadesVazias,
      inadimplentes,
      receitaMensalPrevista,
      receitaMensalRecebida,
      ultimasUnidades
    }

    return NextResponse.json(payload)
  } catch (err) {
    console.error('Erro ao montar dashboard do prédio:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
