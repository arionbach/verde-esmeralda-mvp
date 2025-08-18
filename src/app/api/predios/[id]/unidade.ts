import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET - Listar unidades de um prédio
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 [API] Buscando unidades do prédio:', params.id)
    
    // Verificar se prédio existe
    const predio = await prisma.predio.findUnique({
      where: { id: params.id }
    })
    
    if (!predio) {
      return NextResponse.json(
        { error: 'Prédio não encontrado' },
        { status: 404 }
      )
    }
    
    // Buscar unidades com responsáveis
    const unidades = await prisma.unidade.findMany({
      where: { predioId: params.id },
      include: {
        responsaveis: true,
        pagamentos: {
          orderBy: { dataVencimento: 'desc' },
          take: 1 // Último pagamento
        }
      },
      orderBy: { numero: 'asc' }
    })
    
    console.log(`✅ [API] Encontradas ${unidades.length} unidades`)
    
    return NextResponse.json(unidades)
    
  } catch (error) {
    console.error('❌ [API] Erro ao buscar unidades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova unidade
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log('📝 [API] Criando unidade:', body)
    
    // Validar dados obrigatórios
    const { numero, tipo, metragem, valorTaxa, responsavel } = body
    
    if (!numero || !tipo || !valorTaxa) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: numero, tipo, valorTaxa' },
        { status: 400 }
      )
    }
    
    // Verificar se prédio existe
    const predio = await prisma.predio.findUnique({
      where: { id: params.id }
    })
    
    if (!predio) {
      return NextResponse.json(
        { error: 'Prédio não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se número já existe no prédio
    const unidadeExistente = await prisma.unidade.findFirst({
      where: {
        predioId: params.id,
        numero: numero
      }
    })
    
    if (unidadeExistente) {
      return NextResponse.json(
        { error: 'Já existe uma unidade com este número neste prédio' },
        { status: 409 }
      )
    }
    
    // Criar unidade (com transação para responsável)
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar unidade
      const novaUnidade = await tx.unidade.create({
        data: {
          numero,
          tipo,
          metragem: metragem ? parseFloat(metragem) : null,
          valorTaxa: parseFloat(valorTaxa),
          predioId: params.id
        }
      })
      
      // Criar responsável se fornecido
      let novoResponsavel = null
      if (responsavel && responsavel.nome && responsavel.cpf) {
        novoResponsavel = await tx.responsavel.create({
          data: {
            nome: responsavel.nome,
            cpfCnpj: responsavel.cpf,
            telefone: responsavel.telefone || null,
            email: responsavel.email || null,
            tipo: responsavel.tipo || 'proprietario',
            unidadeId: novaUnidade.id
          }
        })
      }
      
      return { unidade: novaUnidade, responsavel: novoResponsavel }
    })
    
    console.log('✅ [API] Unidade criada:', resultado.unidade.id)
    
    // Retornar unidade com responsável
    const unidadeCompleta = await prisma.unidade.findUnique({
      where: { id: resultado.unidade.id },
      include: {
        responsaveis: true,
        pagamentos: true
      }
    })
    
    return NextResponse.json(unidadeCompleta, { status: 201 })
    
  } catch (error) {
    console.error('❌ [API] Erro ao criar unidade:', error)
    
    // Erro de CPF duplicado
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'CPF já cadastrado em outra unidade' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}