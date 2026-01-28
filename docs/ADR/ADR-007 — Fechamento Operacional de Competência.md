# ADR-007 — Fechamento Operacional de Competência

**Status:** PROPOSTO (apto para implementação incremental)

**Data:** 2025-01-XX

**Decisores:** Arquitetura Verde Esmeralda

**Contexto:** Fase 3 — Políticas de Cobrança (Modelo A)

---

## Contexto

O sistema financeiro do Verde Esmeralda opera sob o **Modelo A — Condominial Real**, no qual:

* `Pagamento` é o **livro-razão único**.
* `RateioItem` é **memória de cálculo de despesas**.
* `AjusteUnidade` é o **único veículo para políticas de cobrança** (taxa mínima, fundo de reserva, exceções).
* KPIs derivam **exclusivamente** de `Pagamento`.

A Fase 3 introduziu políticas financeiras que atuam **entre o rateio e a geração de cobranças**, mantendo o modelo íntegro.
Com isso, surge uma necessidade crítica: **governança temporal da competência**.

Sem um mecanismo explícito de fechamento, o sistema permite:

* reprocessamentos acidentais,
* divergências entre meses já apresentados,
* riscos operacionais e contábeis.

Este ADR define **quando e por quem** o pipeline mensal pode ser executado.

---

## Decisão

Introduzir o conceito de **Fechamento Operacional de Competência**, com regras explícitas de execução e bloqueio, **sem alterar o Modelo A**.

A competência passa a ter **estado operacional**, e políticas/cobranças **não podem rodar livremente em competências fechadas**.

---

## Estados da Competência

Cada competência (`startOfMonth`) possui um estado lógico:

1. **ABERTA**

   * Rateio, políticas e cobranças podem ser executados.
2. **EM_PROCESSAMENTO** (opcional, futuro)

   * Execução em curso (lock operacional).
3. **FECHADA**

   * Nenhuma operação financeira estrutural é permitida.

---

## Regras de Execução (Guardrails)

### Operações BLOQUEADAS em competência FECHADA

* `calcularRateioFixas`
* `calcularPoliticasDoMes`
* `gerarCobrancasPorRateio`
* qualquer reprocesso que gere/atualize:

  * `RateioItem`
  * `AjusteUnidade`
  * `Pagamento`

### Operações PERMITIDAS em competência FECHADA

* Consultas:

  * `resumo-v3`
  * listagens de `Pagamento`
  * relatórios
* Ações de caixa **não estruturais** (decisão futura):

  * pagar / estornar (avaliar em ADR específico)

---

## Autoridade

* Apenas perfis administrativos (síndico/administradora) podem:

  * **fechar** uma competência
  * **reabrir** (se permitido futuramente)
* A decisão de fechamento é **explícita**, nunca implícita.

---

## Modelo de Dados (mínimo)

Este ADR **não impõe schema**, apenas define o contrato.

Implementações possíveis (uma delas):

* Tabela `CompetenciaStatus`

  * `predioId`
  * `competencia`
  * `status` (`ABERTA | FECHADA`)
  * `fechadaEm`
  * `fechadaPor`

Ou campo equivalente em estrutura existente.

> A escolha do storage fica fora deste ADR.

---

## Invariantes Arquiteturais

* ❗ **Nenhuma política de cobrança roda em competência fechada**.
* ❗ **Nenhuma geração de cobrança ocorre em competência fechada**.
* ❗ O fechamento **não altera dados financeiros**, apenas bloqueia ações futuras.
* ❗ KPIs continuam lendo exclusivamente `Pagamento`.

---

## Integração com ADRs Existentes

* **ADR-003** — Políticas via `AjusteUnidade`:
  → Fechamento impede criação/alteração de ajustes.
* **ADR-004** — Idempotência:
  → Fechamento reduz risco operacional mesmo sem índice único.
* **ADR-005** — Imutabilidade temporal:
  → Este ADR é a **camada operacional** do princípio.
* **ADR-006** — Semântica de políticas (`tipoPolitica`):
  → Mantida intacta; apenas governada temporalmente.

---

## Consequências

### Positivas

* Elimina reprocessamentos acidentais.
* Dá segurança contábil e jurídica.
* Protege relatórios já apresentados.
* Torna o pipeline mensal **determinístico e auditável**.

### Custos

* Introduz verificação de estado antes de operações.
* Requer decisão explícita de fechamento (UX futura).

---

## Decisão Final

**Adotar Fechamento Operacional de Competência como regra oficial do sistema financeiro**, bloqueando execuções estruturais após fechamento, **sem alterar o Modelo A**.

Este ADR **protege o futuro do sistema e do time**, permitindo crescimento sem perda de controle.

---

## Próximos Passos (não vinculantes)

* Implementar verificação simples no início de:

  * `calcularRateioFixas`
  * `calcularPoliticasDoMes`
  * `gerarCobrancasPorRateio`
* Sem UI, apenas bloqueio técnico + log.
