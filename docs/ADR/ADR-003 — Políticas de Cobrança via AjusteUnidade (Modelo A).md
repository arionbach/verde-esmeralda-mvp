# ADR-003 — Políticas de Cobrança via AjusteUnidade (Modelo A)

**Status:** ACCEPTED  
**Data:** 2025-12-29  
**Contexto:** Sistema financeiro condominial — Modelo A (Condominial Real)  
**Decisores:** Arquitetura do domínio financeiro

---

## Contexto

O sistema opera no **Modelo A**, no qual:

- `Pagamento` é o **livro-razão único**.
- KPIs (Previsto, Realizado, Inadimplência) derivam **exclusivamente** de `Pagamento`.
- A geração de cobranças mensais ocorre a partir do **rateio por competência**.

Pipeline oficial já existente:

1. `calcularRateioFixas` → gera `RateioItem` (memória de cálculo)
2. `gerarCobrancasPorRateio` → soma `RateioItem` + `AjusteUnidade` e emite `Pagamento(TAXA_MENSAL)`
3. Emissão de despesas → `Pagamento(DESPESA_FIXA | MANUTENCAO)`
4. Operação de caixa (pagar/estornar)
5. KPIs via `Pagamento` (`getResumoV3`)

Com a evolução para a **Fase 3**, surgem políticas de cobrança como:
- taxa mínima por unidade,
- fundo de reserva,
- exceções por unidade (descontos, isenções, complementos).

Era necessário definir **onde essas políticas entram no pipeline** e **qual entidade as representa**, sem quebrar:
- idempotência,
- auditabilidade,
- coerência de KPIs,
- nem exigir refatorações caóticas futuras.

---

## Decisão

Foi decidido que **todas as políticas de cobrança mensal** serão:

- calculadas **entre** o rateio e a geração das cobranças,
- persistidas **exclusivamente** como `AjusteUnidade`,
- aplicadas **por competência e por unidade**,
- e consolidadas apenas no momento da emissão de `Pagamento(TAXA_MENSAL)`.

### Novo passo lógico do pipeline

