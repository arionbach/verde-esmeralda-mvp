-- Fase 2 — Backfill de diaVencimento em DespesaFixa (PostgreSQL)
-- Não executar automaticamente. Revise e rode manualmente na janela planejada.
-- Estratégia: para cada DespesaFixa com diaVencimento IS NULL, usar a moda do dia(dataVencimento)
-- dos Pagamentos tipo 'DESPESA_FIXA'. Fallback: 10 quando não houver dados válidos (1..28).

-- =====================
-- 1) Validação inicial
-- =====================
-- Quantidade de despesas fixas sem diaVencimento
SELECT COUNT(*) AS total_sem_dia
FROM "DespesaFixa"
WHERE "diaVencimento" IS NULL;

-- Opcional: distribuição por prédio
SELECT "predioId", COUNT(*) AS qtd
FROM "DespesaFixa"
WHERE "diaVencimento" IS NULL
GROUP BY "predioId"
ORDER BY qtd DESC;

-- =========================================
-- 2) Prévia: sugerir moda de dia por despesa
-- =========================================
WITH p AS (
  SELECT "despesaFixaId" AS id,
         EXTRACT(DAY FROM "dataVencimento")::int AS dia,
         COUNT(*) AS cnt
  FROM "Pagamento"
  WHERE "despesaFixaId" IS NOT NULL
    AND "tipo" = 'DESPESA_FIXA'
  GROUP BY id, dia
), p_valid AS (
  SELECT id, dia, cnt
  FROM p
  WHERE dia BETWEEN 1 AND 28
), mode_by_desp AS (
  SELECT id, dia
  FROM (
    SELECT id, dia, cnt,
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY cnt DESC, dia ASC) AS rn
    FROM p_valid
  ) t
  WHERE rn = 1
)
SELECT df.id, df.nome, mb.dia AS dia_sugerido
FROM "DespesaFixa" df
LEFT JOIN mode_by_desp mb ON mb.id = df.id
WHERE df."diaVencimento" IS NULL
ORDER BY df.nome;

-- =======================================================
-- 3) Backfill: atualizar diaVencimento com moda ou 10
-- =======================================================
-- Observação: altere o fallback (10) se desejar outro default global.
WITH p AS (
  SELECT "despesaFixaId" AS id,
         EXTRACT(DAY FROM "dataVencimento")::int AS dia,
         COUNT(*) AS cnt
  FROM "Pagamento"
  WHERE "despesaFixaId" IS NOT NULL
    AND "tipo" = 'DESPESA_FIXA'
  GROUP BY id, dia
), p_valid AS (
  SELECT id, dia, cnt
  FROM p
  WHERE dia BETWEEN 1 AND 28
), mode_by_desp AS (
  SELECT id, dia
  FROM (
    SELECT id, dia, cnt,
           ROW_NUMBER() OVER (PARTITION BY id ORDER BY cnt DESC, dia ASC) AS rn
    FROM p_valid
  ) t
  WHERE rn = 1
)
UPDATE "DespesaFixa" df
SET "diaVencimento" = COALESCE(
  (SELECT mb.dia FROM mode_by_desp mb WHERE mb.id = df.id),
  10
)
WHERE df."diaVencimento" IS NULL;

-- ========================
-- 4) Validação pós-backfill
-- ========================
-- Quantidade remanescente de NULLs
SELECT COUNT(*) AS total_sem_dia_restante
FROM "DespesaFixa"
WHERE "diaVencimento" IS NULL;

-- Valores fora do range 1..28 (não esperado nesta estratégia)
SELECT COUNT(*) AS total_fora_range
FROM "DespesaFixa"
WHERE "diaVencimento" IS NOT NULL
  AND ("diaVencimento" < 1 OR "diaVencimento" > 28);

-- Listagem de outliers (se houver)
SELECT id, nome, "predioId", "diaVencimento"
FROM "DespesaFixa"
WHERE "diaVencimento" IS NOT NULL
  AND ("diaVencimento" < 1 OR "diaVencimento" > 28)
ORDER BY nome;

