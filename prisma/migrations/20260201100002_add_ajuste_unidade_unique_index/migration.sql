-- Migration: Índice único em AjusteUnidade para idempotência (ADR-004)
-- Contexto: skipDuplicates no código só funciona com índice único.
-- Garante que não existam ajustes duplicados por política/unidade/competência.

-- Nota: tipoPolitica pode ser NULL para ajustes legados.
-- O índice único com NULL permite múltiplos registros com tipoPolitica=NULL
-- para a mesma combinação (comportamento desejado para ajustes manuais).

-- Para políticas com tipoPolitica definido, garante unicidade.
CREATE UNIQUE INDEX "AjusteUnidade_idempotencia_ux"
ON "AjusteUnidade" ("predioId", "unidadeId", "competencia", "tipoPolitica")
WHERE "tipoPolitica" IS NOT NULL;
