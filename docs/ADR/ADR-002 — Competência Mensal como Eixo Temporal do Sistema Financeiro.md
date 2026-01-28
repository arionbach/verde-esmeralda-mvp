# ADR-002 — Competência Mensal como Eixo Temporal do Sistema Financeiro

**Status:** ACCEPTED  
**Data:** 2025-12-29  
**Contexto:** Sistema financeiro condominial — Modelo A (Condominial Real)  
**Decisores:** Arquitetura do domínio financeiro

---

## Contexto

Sem um eixo temporal claro, sistemas financeiros sofrem com:

- datas inconsistentes,
- cálculos dependentes de “quando rodou”,
- reprocessos perigosos,
- dificuldade de explicar resultados mensais.

Era necessário definir **uma unidade temporal única e explícita** para toda a geração financeira.

---

## Decisão

Foi decidido que o sistema financeiro é **estritamente orientado por competência mensal**.

Isso significa que:
- toda geração financeira ocorre **por competência**,
- a competência é a unidade mínima de cálculo, geração, reprocesso e fechamento,
- datas de pagamento **não alteram a competência**.

---

## Definição de Competência

- Competência representa um **mês contábil**.
- É armazenada de forma **normalizada** (ex.: início do mês).
- Toda entidade financeira relevante referencia explicitamente uma competência.

---

## Regras Temporais

- **Geração** ocorre sempre por competência.
- **Reprocessamento** ocorre sempre por competência.
- **KPIs** são agregações por competência.
- **Pagamentos em atraso** continuam pertencendo à competência original.
- **Pagamento antecipado** não muda competência.

---

## Relação com Pagamento

Cada `Pagamento`:
- pertence a **uma e somente uma competência**,
- nunca muda de competência após criado,
- representa um fato contábil daquele mês.

---

## O que é explicitamente proibido

- ❌ Geração financeira sem competência explícita
- ❌ Alterar competência de um `Pagamento`
- ❌ Misturar datas operacionais com competência contábil
- ❌ Calcular KPIs sem filtro por competência

---

## Justificativa

Essa decisão:

- garante previsibilidade,
- facilita reprocessos,
- permite fechamento mensal,
- separa tempo contábil de tempo operacional.

Alternativas descartadas:
- geração baseada em datas correntes,
- lógica “rolling” sem competência fixa,
- dependência do momento da execução.

---

## Consequências

### Positivas
- Sistema explicável mês a mês
- Reprocessos controláveis
- Base sólida para fechamento de competência

### Negativas / Trade-offs
- Exige normalização rigorosa de datas
- Impede “ajustes soltos” fora do mês

Os trade-offs são aceitos.

---

## Relação com ADRs Posteriores

- **ADR-003**: políticas entram por competência
- **ADR-004**: idempotência definida por competência
- **ADR-005**: fechamento ocorre por competência

Este ADR sustenta todos os demais.

---

## Conclusão

A **competência mensal é o eixo temporal absoluto** do sistema financeiro.

Nenhuma lógica financeira pode existir fora dela.
