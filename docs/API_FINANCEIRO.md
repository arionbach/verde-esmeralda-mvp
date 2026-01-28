# API Financeiro — Resumo (Fase 1)

Esta documentação consolida o contrato do resumo financeiro baseado em Pagamento (Modelo A — Condominial Real).

- Livro‑razão único: `Pagamento`
- KPIs: Previsto/Realizado calculados exclusivamente a partir de `Pagamento`
- Inadimplência: somente sobre `TAXA_MENSAL`

## Endpoint (validação da Fase 1)

- `GET /api/predios/:id/financeiro/resumo-v3?competencia=YYYY-MM`

### Query
- `competencia` (obrigatório, formato `YYYY-MM`)

### Resposta (JSON)
- `competencia`: string `YYYY-MM`
- `kpisPrevisto`:
  - `receitasPrevistas`: number — soma de `Pagamento(TAXA_MENSAL)` na competência (status ≠ CANCELADO)
  - `despesasPrevistas`: number — soma de `Pagamento(DESPESA_FIXA|MANUTENCAO)` na competência (status ≠ CANCELADO)
  - `saldoPrevisto`: number — `receitasPrevistas - despesasPrevistas`
- `kpisRealizado`:
  - `receitasPagas`: number — soma de `Pagamento(TAXA_MENSAL)` com `status = PAGO`
  - `despesasPagas`: number — soma de `Pagamento(DESPESA_FIXA|MANUTENCAO)` com `status = PAGO`
  - `saldoRealizado`: number — `receitasPagas - despesasPagas`
- `inadimplencia` (pode ser adicionado posteriormente; hoje os campos de inadimplência estão distribuídos):
  - `unidadesComCobranca`: number — quantidade de unidades que possuem `TAXA_MENSAL` emitida na competência
  - `unidadesInadimplentes`: number — unidades com pendência vencida (não paga)
  - `percentual`: number — `(unidadesInadimplentes / unidadesComCobranca) * 100`
- `pendencias`: array
  - `id`: string — id do pagamento
  - `unidadeId`: string — unidade devida
  - `valor`: number
  - `status`: 'PENDENTE' | 'ATRASADO' | 'PAGO' | 'CANCELADO'
  - `diasAtraso`: number
- `kpis` (deprecated — compatibilidade temporária com a UI atual):
  - `totalDevido`: number — igual a `kpisPrevisto.receitasPrevistas`
  - `totalRecebido`: number — igual a `kpisRealizado.receitasPagas`
  - `despesasFixasMes`: number — soma de `Pagamento(DESPESA_FIXA)` na competência
  - `saldoPrevisto`: number — `kpisPrevisto.receitasPrevistas - despesasFixasMes`

## Observações de contrato
- KPIs devem SEMPRE derivar de `Pagamento`. Não utilizar cadastro (`DespesaFixa`) diretamente em cálculos do resumo.
- A base de inadimplência considera apenas `TAXA_MENSAL` emitida na competência.
- Este endpoint é temporário para validação da Fase 1; a versão final deverá consolidar em `/resumo` após a migração da UI.

