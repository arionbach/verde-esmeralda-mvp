-- CICLO 8: Unicidade por (predioId, unidadeId, competencia, tipo)
ALTER TABLE "Pagamento"
  ADD CONSTRAINT "Pagamento_predio_unidade_comp_tipo_ux"
  UNIQUE ("predioId", "unidadeId", "competencia", "tipo");

