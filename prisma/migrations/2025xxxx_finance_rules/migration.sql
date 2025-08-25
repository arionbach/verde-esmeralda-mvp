-- Extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Check constraints (competência e valor)
ALTER TABLE public."Pagamento"
  ADD CONSTRAINT IF NOT EXISTS "Pagamento_competencia_mes_ck"
  CHECK (competencia IS NULL OR competencia = date_trunc('month', competencia));

ALTER TABLE public."Pagamento"
  ADD CONSTRAINT IF NOT EXISTS "Pagamento_taxa_mensal_comp_obrig_ck"
  CHECK (NOT (tipo = 'TAXA_MENSAL' AND competencia IS NULL));

ALTER TABLE public."Pagamento"
  ADD CONSTRAINT IF NOT EXISTS "Pagamento_parcela_obrig_quando_manut_ck"
  CHECK ("manutencaoId" IS NULL OR "numeroParcela" IS NOT NULL);

ALTER TABLE public."Pagamento"
  ADD CONSTRAINT IF NOT EXISTS "Pagamento_valor_nonneg_ck"
  CHECK (valor >= 0);

-- Unique parcial (idempotência TAXA_MENSAL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='Pagamento' AND indexname='ux_pag_taxa_mensal'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX ux_pag_taxa_mensal
             ON public."Pagamento" ("unidadeId", competencia)
             WHERE tipo = ''TAXA_MENSAL''::"PagamentoTipo"';
  END IF;
END$$;

-- Unique manutenção+parcela (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Pagamento_manutencao_parcela_ux'
  ) THEN
    EXECUTE 'ALTER TABLE public."Pagamento"
             ADD CONSTRAINT "Pagamento_manutencao_parcela_ux"
             UNIQUE ("manutencaoId","numeroParcela")';
  END IF;
END$$;

-- Índice para unidades ativas do prédio (não parcial no Prisma)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='Unidade' AND indexname='Unidade_predio_ativas_idx'
  ) THEN
    EXECUTE 'CREATE INDEX "Unidade_predio_ativas_idx"
             ON public."Unidade"("predioId")
             WHERE ativo = true AND "deletedAt" IS NULL';
  END IF;
END$$;

-- Função de geração de taxa mensal (versão NOT EXISTS)
CREATE OR REPLACE FUNCTION public.fn_gerar_taxa_mensal(
  p_predio_id text,
  p_competencia timestamp without time zone,
  p_data_vencimento timestamp without time zone
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_competencia timestamp without time zone := date_trunc('month', p_competencia);
  v_rows integer := 0;
BEGIN
  INSERT INTO public."Pagamento" (
    id, valor, "dataVencimento", "dataPagamento", "numeroParcela",
    observacao, "createdAt", "updatedAt", "unidadeId", "manutencaoId",
    competencia, tipo, status
  )
  SELECT
    gen_random_uuid()::text,
    u."valorTaxa",
    p_data_vencimento,
    NULL,
    NULL,
    'Taxa condominial ' || to_char(v_competencia, 'YYYY-MM'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    u.id,
    NULL,
    v_competencia,
    'TAXA_MENSAL'::"PagamentoTipo",
    'PENDENTE'::"PagamentoStatus"
  FROM public."Unidade" u
  WHERE u."predioId" = p_predio_id
    AND u.ativo = true
    AND u."deletedAt" IS NULL
    AND u."valorTaxa" > 0
    AND NOT EXISTS (
      SELECT 1
      FROM public."Pagamento" p
      WHERE p."unidadeId" = u.id
        AND p.tipo = 'TAXA_MENSAL'::"PagamentoTipo"
        AND p.competencia = v_competencia
    );

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows;
END;
$$;
