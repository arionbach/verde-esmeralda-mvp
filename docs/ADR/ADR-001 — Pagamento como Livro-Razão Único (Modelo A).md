# ADR-001 — Pagamento como Livro-Razão Único (Modelo A)

**Status:** ACCEPTED  
**Data:** 2025-12-29  
**Contexto:** Sistema financeiro condominial — Modelo A (Condominial Real)  
**Decisores:** Arquitetura do domínio financeiro

---

## Contexto

Sistemas financeiros condominiais frequentemente misturam:

- cadastros (despesas, taxas),
- cálculos intermediários (rateios),
- e fatos contábeis (pagamentos),

gerando múltiplas “fontes de verdade”. Isso leva a:
- KPIs divergentes,
- dificuldade de auditoria,
- reprocessos inseguros,
- e inconsistências históricas.

Para evitar esses problemas, era necessário definir **uma única entidade como fonte oficial da verdade financeira**.

---

## Decisão

Foi decidido que **`Pagamento` é o livro-razão único do sistema**.

Isso significa que:

- Todo valor financeiro relevante **deve existir como `Pagamento`**.
- KPIs (Previsto, Realizado, Inadimplência) **derivam exclusivamente de `Pagamento`**.
- Nenhuma outra entidade pode ser usada como base para saldos ou indicadores.

---

## Definição de Livro-Razão

`Pagamento` representa um **fato contábil** e possui, no mínimo:

- `predioId`
- `unidadeId` (quando aplicável)
- `tipo` (`TAXA_MENSAL`, `DESPESA_FIXA`, `MANUTENCAO`, etc.)
- `competencia`
- `valor`
- `status` (`PENDENTE`, `ATRASADO`, `PAGO`)

Somente `Pagamento`:
- entra em KPIs,
- afeta saldo,
- representa histórico financeiro.

---

## Papel das Demais Entidades

- **DespesaFixa**
  - Cadastro declarativo
  - Não é fato contábil
  - Só impacta finanças quando gera `Pagamento`

- **RateioItem**
  - Memória de cálculo
  - Nunca entra em KPIs
  - Sempre descartável

- **AjusteUnidade**
  - Políticas de cobrança
  - Não é ledger
  - Só impacta finanças quando consolidado em `Pagamento`

---

## O que é explicitamente proibido

- ❌ Calcular KPIs a partir de `DespesaFixa`
- ❌ Calcular KPIs a partir de `RateioItem`
- ❌ Calcular KPIs a partir de `AjusteUnidade`
- ❌ Considerar cadastro como valor financeiro realizado ou previsto

Qualquer violação descaracteriza o Modelo A.

---

## Justificativa

Essa decisão:

- garante **fonte única da verdade**,
- facilita auditoria e explicação,
- permite reprocessos seguros,
- separa claramente:
  - *intenção* (cadastro),
  - *cálculo* (rateio),
  - *realidade* (pagamento).

Alternativas descartadas:
- múltiplos livros-razão,
- KPIs híbridos,
- consolidação “on-the-fly”.

---

## Consequências

### Positivas
- KPIs sempre coerentes
- Histórico confiável
- Arquitetura previsível

### Negativas / Trade-offs
- Exige disciplina para não “ler do cadastro”
- Pode parecer mais verboso inicialmente

Os trade-offs são aceitáveis.

---

## Status do legado

- Fluxos que usam cadastros para KPIs são **deprecated**.
- Este ADR prevalece sobre qualquer comportamento anterior.

---

## Conclusão

`Pagamento` é o **livro-razão único e soberano** do sistema financeiro.

Toda decisão arquitetural futura deve preservar esta regra.
