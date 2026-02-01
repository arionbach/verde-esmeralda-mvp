-- Migration: diaVencimento NOT NULL em DespesaFixa
-- Contexto: ADR/DECISOES.md define diaVencimento como obrigatório (1-28)
-- mas o schema permite NULL, criando inconsistência.

-- 1. Backfill: preencher registros existentes com valor padrão (dia 10)
UPDATE "DespesaFixa"
SET "diaVencimento" = 10
WHERE "diaVencimento" IS NULL;

-- 2. Alterar coluna para NOT NULL
ALTER TABLE "DespesaFixa"
ALTER COLUMN "diaVencimento" SET NOT NULL;

-- 3. Adicionar CHECK constraint para garantir range 1-28
ALTER TABLE "DespesaFixa"
ADD CONSTRAINT "DespesaFixa_diaVencimento_check"
CHECK ("diaVencimento" >= 1 AND "diaVencimento" <= 28);
