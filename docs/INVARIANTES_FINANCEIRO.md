# Invariantes Arquiteturais — Módulo Financeiro (Modelo A)

- Livro‑razão único: `Pagamento` é a única fonte para KPIs (Previsto/Realizado), relatórios e saldos.
- RateioItem: memória de cálculo por competência (não carrega políticas; reproduz apenas alocação de despesas).
- Políticas (taxa mínima, fundo de reserva, exceções por unidade): `AjusteUnidade` (CREDITO/DEBITO) por competência e unidade.
- DespesaFixa: cadastro/contrato do fornecedor; emissão mensal vira `Pagamento(DESPESA_FIXA)`.
- KPIs: nunca somar direto de cadastros (ex.: DespesaFixa); sempre via `Pagamento` da competência.
- Idempotência: geração por competência deve ser idempotente (rateio, despesas fixas, cobranças por rateio).

## Pontos de Extensão (preparação para Fase 3)
- “Políticas do mês” entre “calcular rateio” e “gerar cobranças por rateio”.
  - Materializar como `AjusteUnidade` (mínimo, fundo, exceções).
  - Consolidação final: soma de `RateioItem` + `AjusteUnidade` → `Pagamento(TAXA_MENSAL)`.
- Guardrails no código:
  - getResumoV3: não consultar `DespesaFixa` (cadastro) — somente `Pagamento`.
  - Não alterar valores de `RateioItem` para aplicar políticas.

Este documento consolida decisões e serve de referência rápida para revisões de PR.
