-- Migration: add enum TipoPoliticaAjuste and nullable column AjusteUnidade.tipoPolitica
-- Context: PostgreSQL

CREATE TYPE "TipoPoliticaAjuste" AS ENUM ('TAXA_MINIMA', 'FUNDO_RESERVA', 'EXCECAO');

ALTER TABLE "AjusteUnidade"
ADD COLUMN "tipoPolitica" "TipoPoliticaAjuste";

