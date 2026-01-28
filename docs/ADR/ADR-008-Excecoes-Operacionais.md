# ADR-008  Exceções Operacionais (Isenções, Acordos, Créditos)

**Status:** PROPOSTO (apto para implementação incremental)
**Data:** 2025-01-XX
**Decisores:** Arquitetura Verde Esmeralda
**Contexto:** Fase 3 — Políticas de Cobrança (Modelo A)

---

## Contexto

Sob o Modelo A (Condominial Real):
- `Pagamento` é o livro‑razão único.
- `RateioItem` é memória de cálculo (despesas alocadas).
- `AjusteUnidade` é o único veículo para políticas (taxa mínima, fundo, exceções — ADR‑003/ADR‑006).
- KPIs derivam exclusivamente de `Pagamento` (Fase 1 — V3).

Exceções operacionais (isenções temporárias, acordos, créditos negociados) precisam ser refletidas no mês de forma controlada, sem violar o Modelo A nem alterar dados estruturais.

---

## Decisão

Representar exceções operacionais exclusivamente via `AjusteUnidade`:
- `tipoPolitica = EXCECAO` (ADR‑006)
- `natureza = CREDITO` (reduz cobrança) ou `DEBITO` (acréscimo acordado), conforme decisão operacional.
- Competência normalizada (startOfMonth) por unidade.
- Sem tocar em `RateioItem` ou `Pagamento` diretamente.

---

## Regras de Execução

- Só criar/alterar `AjusteUnidade` para exceções quando a competência estiver **ABERTA** (ADR‑007).
- Idempotência por *(predioId, unidadeId, competencia, tipoPolitica)* — uma exceção por mês/unidade; reprocessos atualizam a mesma linha.
- Descrição auditável obrigatória (referência à decisão/ata/solicitação e validade temporal).
- Cálculo e persistência em Decimal (sem Number em decisões).

### Tipos comuns de exceção (exemplos)
- Isenção temporária (1 mês): `natureza = CREDITO`, valor definido.
- Acordo de parcelamento extraordinário: `natureza = DEBITO`, valor parcial adicional.
- Crédito manual (compensação): `natureza = CREDITO`, valor definido.

> Observação: a definição do valor/percentual da exceção é um ato operacional; o sistema não impõe fórmula nesta fase.

---

## Invariantes Arquiteturais

- `Pagamento` continua sendo o único livro‑razão; exceções ajustam o valor consolidado via soma de ajustes.
- `RateioItem` permanece memória de despesas (não recebe exceção).
- KPIs seguem refletindo apenas `Pagamento` (o ajuste entra por consolidação).
- Sem exceções em competência **FECHADA** (ADR‑007).

---

## Modelo de Dados

- Sem migração adicional (ADR‑006 já introduziu `tipoPolitica = EXCECAO`).
- Opcional futuro (não obrigatório aqui): índice único em `AjusteUnidade` para *(predioId, unidadeId, competencia, tipoPolitica)* — vide ADR‑004.

---

## Integração com ADRs

- **ADR‑003:** Políticas via `AjusteUnidade` — reforçado (exceções inclusas).
- **ADR‑004:** Idempotência — recomendado hardening com índice único (futuro).
- **ADR‑005:** Imutabilidade temporal — exceções não retroagem sem processo controlado.
- **ADR‑006:** Tipagem semântica — `tipoPolitica = EXCECAO` padroniza a identificação.
- **ADR‑007:** Fechamento Operacional — exceções bloqueadas em competência FECHADA.

---

## Consequências

### Positivas
- Governança clara de isenções/acordos sem violar o Modelo A.
- Auditabilidade por competência/unidade.
- Idempotência operacional previsível.

### Custos
- Exige disciplina operacional (quem pode registrar exceções, quando e como).
- Necessidade de referência documental (descrição) para auditoria futura.

---

## Próximos Passos (quando aprovado)

- Expor endpoint técnico protegido para registrar exceções via `AjusteUnidade` (`tipoPolitica = EXCECAO`), sem UI.
- Smoke operacional simples: registrar exceção, consolidar cobrança, verificar composição no boleto *(Pagamento = Σ RateioItem ± Ajustes)*.
- (Opcional) Adicionar índice único em `AjusteUnidade` para hardening (ADR‑004).
