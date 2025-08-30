-- Make unidadeId nullable
ALTER TABLE "Pagamento" ALTER COLUMN "unidadeId" DROP NOT NULL;

-- Add despesaFixaId column and FK
ALTER TABLE "Pagamento" ADD COLUMN IF NOT EXISTS "despesaFixaId" TEXT;
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_despesaFixaId_fkey"
  FOREIGN KEY ("despesaFixaId") REFERENCES "DespesaFixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique per despesa/competencia
CREATE UNIQUE INDEX IF NOT EXISTS "Pagamento_despesa_comp_ux" ON "Pagamento" ("despesaFixaId", "competencia");
