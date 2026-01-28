import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"

// Handlers serão importados dinamicamente após os mocks
let GET: any, PUT: any, DELETE: any, PATCH: any

// Mock dos helpers de resposta — usar o MESMO path importado pela rota
vi.mock("src/app/api/_utils", () => {
  return {
    ok: vi.fn((data: any) => ({ kind: "ok", data })),
    bad: vi.fn((message: string, details?: any) => ({ kind: "bad", message, details })),
    notFound: vi.fn((message: string) => ({ kind: "notFound", message })),
    conflict: vi.fn((message: string) => ({ kind: "conflict", message })),
    noContent: vi.fn(() => ({ kind: "noContent" })),
    handlePrismaError: vi.fn((e: any) => ({ kind: "prismaError", e })),
  }
})

// Mock do Prisma — usar o MESMO path importado pela rota (usar vi.hoisted para evitar hoisting issues)
const prismaMock = vi.hoisted(() => ({
  responsavel: {
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  unidade: {
    findFirst: vi.fn(),
  },
}))
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

// Mock do _schemas (mesmo path do route.ts) com validação determinística
vi.mock("src/app/api/_schemas", async () => {
  const { z } = await import("zod")
  const ResponsavelUpdateSchema = z
    .object({
      nome: z.string().min(1).optional(),
      cpfCnpj: z.string().min(11).optional(),
      telefone: z.string().optional(),
      whatsapp: z.string().optional(),
      email: z.string().email().optional(),
      // tipo é normalizado via domínio; manter permissivo aqui
      tipo: z.any().optional(),
      ehTitularCobranca: z.boolean().optional(),
    })
    .strict()
  return { ResponsavelUpdateSchema }
})

// Mock do domínio (mesmo path do route.ts)
vi.mock("@/domain/unidades", () => ({
  toResponsavelTipoEnum: (v: any) => v,
}))

function makeParams(p: { id: string; unidadeId: string; responsavelId: string }) {
  return { params: Promise.resolve(p) } as any
}

function makeReqJson(body: any) {
  return { json: vi.fn(async () => body) } as any
}

const good = {
  id: "11111111-1111-1111-8111-111111111111",
  unidadeId: "22222222-2222-2222-9222-222222222222",
  responsavelId: "33333333-3333-3333-a333-333333333333",
}

describe("route responsaveis/[responsavelId]", () => {
  beforeAll(async () => {
    ({ GET, PUT, DELETE, PATCH } = await import("./route"))
  })
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // GET
  it("GET: bad quando IDs inválidos", async () => {
    const res = await GET({} as any, makeParams({ id: "x", unidadeId: "y", responsavelId: "z" }))
    expect(res.kind).toBe("bad")
  })

  it("GET: notFound quando não existe", async () => {
    prismaMock.responsavel.findFirst.mockResolvedValueOnce(null)
    const res = await GET({} as any, makeParams(good))
    expect(res.kind).toBe("notFound")
    expect(res.message).toMatch(/Responsável não encontrado/)
  })

  it("GET: ok quando encontra", async () => {
    prismaMock.responsavel.findFirst.mockResolvedValueOnce({ id: "r1" })
    const res = await GET({} as any, makeParams(good))
    expect(res.kind).toBe("ok")
    expect(res.data).toEqual({ id: "r1" })
  })

  // PUT
  it("PUT: bad quando IDs inválidos", async () => {
    const res = await PUT(
      makeReqJson({}) as any,
      makeParams({ id: "x", unidadeId: "y", responsavelId: "z" })
    )
    expect(res.kind).toBe("bad")
  })

  it("PUT: notFound quando não acha atual", async () => {
    prismaMock.responsavel.findFirst.mockResolvedValueOnce(null)
    const res = await PUT(makeReqJson({}), makeParams(good))
    expect(res.kind).toBe("notFound")
    expect(res.message).toMatch(/Responsável não encontrado nessa unidade/)
  })

  it('PUT: body inválido retorna bad("Dados inválidos") (tipo incorreto)', async () => {
    // Arrange: atual existe
    prismaMock.responsavel.findFirst.mockResolvedValueOnce({ id: good.responsavelId, unidadeId: good.unidadeId })
    const res = await PUT(makeReqJson({ ehTitularCobranca: "true" as any }), makeParams(good))
    expect(res.kind).toBe("bad")
    expect(res.message).toMatch(/Dados inválidos/)
  })

  it("PUT: ehTitularCobranca=true desmarca os demais e atualiza", async () => {
    prismaMock.responsavel.findFirst.mockResolvedValueOnce({ id: good.responsavelId, unidadeId: good.unidadeId })
    prismaMock.responsavel.updateMany.mockResolvedValueOnce({ count: 1 })
    prismaMock.responsavel.update.mockResolvedValueOnce({ id: good.responsavelId, ehTitularCobranca: true })

    const res = await PUT(makeReqJson({ ehTitularCobranca: true }), makeParams(good))

    expect(prismaMock.responsavel.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unidadeId: good.unidadeId,
          id: { not: good.responsavelId },
          ativo: true,
        }),
        data: { ehTitularCobranca: false },
      })
    )
    expect(prismaMock.responsavel.update).toHaveBeenCalled()
    expect(res.kind).toBe("ok")
  })

  // DELETE
  it("DELETE: bad quando IDs inválidos", async () => {
    const res = await DELETE({} as any, makeParams({ id: "x", unidadeId: "y", responsavelId: "z" }))
    expect(res.kind).toBe("bad")
  })

  it("DELETE: notFound quando não existe ativo", async () => {
    prismaMock.responsavel.findFirst.mockResolvedValueOnce(null)
    const res = await DELETE({} as any, makeParams(good))
    expect(res.kind).toBe("notFound")
    expect(res.message).toMatch(/Responsável não encontrado/)
  })

  it("DELETE: soft delete (ativo=false, dataFim=Date)", async () => {
    prismaMock.responsavel.findFirst.mockResolvedValueOnce({ id: good.responsavelId })
    prismaMock.responsavel.update.mockResolvedValueOnce({ id: good.responsavelId, ativo: false })

    const res = await DELETE({} as any, makeParams(good))
    expect(prismaMock.responsavel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: good.responsavelId },
        data: expect.objectContaining({
          ativo: false,
          dataFim: expect.any(Date),
        }),
      })
    )
    expect(res.kind).toBe("noContent")
  })

  // PATCH
  it("PATCH: reativa e pode tornar titular", async () => {
    prismaMock.responsavel.findFirst.mockResolvedValueOnce({ id: good.responsavelId }) // inativo existe
    prismaMock.responsavel.updateMany.mockResolvedValueOnce({ count: 1 })
    prismaMock.responsavel.update.mockResolvedValueOnce({
      id: good.responsavelId,
      ativo: true,
      ehTitularCobranca: true,
    })

    const req = makeReqJson({ tornarTitular: true })
    const res = await PATCH(req as any, makeParams(good))

    expect(prismaMock.responsavel.updateMany).toHaveBeenCalled()
    expect(prismaMock.responsavel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ativo: true,
          dataFim: null,
          ehTitularCobranca: true,
        }),
      })
    )
    expect(res.kind).toBe("ok")
  })

  it("PATCH: reativa sem tornarTitular (não chama updateMany)", async () => {
    prismaMock.responsavel.findFirst.mockResolvedValueOnce({ id: good.responsavelId })
    prismaMock.responsavel.update.mockResolvedValueOnce({ id: good.responsavelId, ativo: true })

    const req = makeReqJson({})
    const res = await PATCH(req as any, makeParams(good))

    expect(prismaMock.responsavel.updateMany).not.toHaveBeenCalled()
    expect(prismaMock.responsavel.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ ativo: true, dataFim: null }),
      })
    )
    expect(res.kind).toBe("ok")
  })

  it("PATCH: notFound quando não existe inativo", async () => {
    prismaMock.responsavel.findFirst.mockResolvedValueOnce(null)
    const req = makeReqJson({})
    const res = await PATCH(req as any, makeParams(good))
    expect(res.kind).toBe("notFound")
    expect(res.message).toMatch(/Responsável não encontrado ou já está ativo/)
  })
})
