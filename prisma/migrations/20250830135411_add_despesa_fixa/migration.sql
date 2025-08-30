-- Create DespesaFixa table
CREATE TABLE IF NOT EXISTS "DespesaFixa" (
  "id" TEXT PRIMARY KEY,
  "predioId" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "valor" DECIMAL(14,2) NOT NULL,
  "diaVencimento" INTEGER NOT NULL,
  "categoria" TEXT,
  "dataInicio" TIMESTAMP,
  "dataFim" TIMESTAMP,
  "ativo" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "DespesaFixa_predioId_fkey" FOREIGN KEY ("predioId") REFERENCES "Predio"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS "DespesaFixa_predio_ativo_idx" ON "DespesaFixa" ("predioId", "ativo");

-- Enum extension for PagamentoTipo
DO  BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'PagamentoTipo' AND e.enumlabel = 'DESPESA_FIXA') THEN
    ALTER TYPE "PagamentoTipo" ADD VALUE 'DESPESA_FIXA';
  END IF;
END ;
