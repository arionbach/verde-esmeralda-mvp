-- Migration: competencia NOT NULL em Pagamento
-- Contexto: ADR-002 define competência como eixo temporal absoluto,
-- mas o schema permite NULL, violando a invariante.

-- 1. Backfill: preencher registros existentes usando o mês do vencimento
UPDATE "Pagamento"
SET "competencia" = DATE_TRUNC('month', "dataVencimento")
WHERE "competencia" IS NULL;

-- 2. Alterar coluna para NOT NULL
ALTER TABLE "Pagamento"
ALTER COLUMN "competencia" SET NOT NULL;
