# ADR-006 — Identificação Semântica de Políticas em AjusteUnidade (ENUM)

**Status:** ACCEPTED  
**Data:** 2025-12-29  
**Contexto:** Sistema financeiro condominial — Modelo A (Condominial Real)  
**Decisores:** Arquitetura do domínio financeiro

---

## Contexto

Na Fase 3 do sistema financeiro, políticas de cobrança mensal
(taxa mínima, fundo de reserva, exceções por unidade) são modeladas
exclusivamente por meio da entidade `AjusteUnidade`, conforme ADR-003.

Para garantir:
- idempotência forte,
- reprocessamento seguro (ADR-004),
- auditoria clara,
- e ausência de heurísticas frágeis,

é necessário identificar **de forma semântica e estável**
qual política originou cada ajuste.

O uso de texto livre (`descricao`) como critério de identificação
foi explicitamente rejeitado por ser frágil, não auditável
e inseguro em sistemas financeiros.

---

## Decisão

Foi decidido que **toda política aplicada via `AjusteUnidade` será identificada
por um campo ENUM explícito**, denominado `tipoPolitica`.

Esse campo passa a ser **a única chave semântica válida**
para identificação, idempotência e reprocessamento de ajustes de política.

---

## Modelagem Adotada

### ENUM de Política

```prisma
enum TipoPoliticaAjuste {
  TAXA_MINIMA
  FUNDO_RESERVA
  EXCECAO
}

model AjusteUnidade {
  id           String @id @default(uuid())
  predioId     String
  unidadeId    String
  competencia  DateTime
  tipoPolitica TipoPoliticaAjuste
  natureza     NaturezaLancamento
  valor        Decimal
  descricao    String
}

Regras Arquiteturais

tipoPolitica é obrigatório para ajustes de política.

A idempotência de políticas é definida por:

(predioId, unidadeId, competencia, tipoPolitica)


descricao é exclusivamente auditável:

nunca usada para lógica,

pode mudar livremente,

pode ser internacionalizada.