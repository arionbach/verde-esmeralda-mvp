-- Migration: add diaVencimento (nullable) to DespesaFixa
-- Generated for PostgreSQL

ALTER TABLE "DespesaFixa"
ADD COLUMN "diaVencimento" INTEGER;

