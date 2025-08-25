// src/app/api/predios/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  ok, 
  bad, 
  handlePrismaError,
  getPaginationParams,
  paginated 
} from '../_utils'

/**
 * GET /api/predios
 * Lista prédios com _count de unidades (sem filtro)
 * Paginação: ?page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const params = getPaginationParams(searchParams)

    const [predios, total] = await Promise.all([
      prisma.predio.findMany({
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            // ⚠️ usar só o count simples aqui (sem where)
            select: { unidades: true }
          }
        }
      }),
      prisma.predio.count()
    ])

    if (!searchParams.has('page') && !searchParams.has('limit')) {
      return ok(predios)
    }
    return paginated(predios, total, params)
  } catch (error) {
    console.error('[GET /api/predios]', error)
    return handlePrismaError(error)
  }
}
