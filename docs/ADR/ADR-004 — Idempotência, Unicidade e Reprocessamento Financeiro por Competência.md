# ADR-004 — Idempotência, Unicidade e Reprocessamento Financeiro por Competência

**Status:** ACCEPTED  
**Data:** 2025-12-29  
**Contexto:** Sistema financeiro condominial — Modelo A (Condominial Real)  
**Decisores:** Arquitetura do domínio financeiro

---

## Contexto

O sistema financeiro opera no **Modelo A**, no qual:

- `Pagamento` é o **livro-razão único**.
- KPIs (Previsto, Realizado, Inadimplência) derivam **exclusivamente** de `Pagamento`.
- A geração financeira ocorre por **competência mensal**.
- O pipeline oficial é baseado em:
  - `RateioItem` como memória de cálculo,
  - `AjusteUnidade` como políticas de cobrança,
  - `Pagamento` como resultado final.

Com a evolução para Fases 2 e 3, surgem riscos operacionais clássicos:

- execução duplicada de geração mensal,
- reprocessamentos parciais,
- cobranças duplicadas,
- medo de recalcular meses já operados,
- inconsistência entre meses pagos e não pagos.

Era necessário definir **regras explícitas de idempotência e reprocessamento**, sem exigir:
- migração de banco imediata,
- refatoração ampla,
- remoção do legado.

---

## Decisão

Foi decidido que o sistema financeiro adota **idempotência por competência**, com regras claras de:

- unicidade lógica,
- descarte seguro,
- imutabilidade de pagamentos pagos,
- e ordem oficial de reprocessamento.

Essas regras valem para **todos os fluxos oficiais do Modelo A**.

---

## Unidade de Idempotência

A **unidade mínima de unicidade lógica** no domínio financeiro é definida como:


Onde:
- `tipo` ∈ { `TAXA_MENSAL`, `DESPESA_FIXA`, `MANUTENCAO`, ... }
- `competencia` é normalizada (início do mês)

Essa unidade define:
- quando algo pode ser recriado,
- quando algo é duplicata,
- quando algo é imutável.

---

## Regras de Descarte por Entidade

### RateioItem
- Sempre **descartável**.
- Nunca representa fato contábil.
- Pode ser apagado e recriado livremente.
- Não afeta KPIs.

### AjusteUnidade
- Sempre **descartável**.
- Representa políticas, não histórico contábil.
- Pode ser apagado e reaplicado por competência.

### Pagamento
- Representa fato contábil.
- Possui regras de imutabilidade condicionais ao status.

---

## Regra de Imutabilidade de Pagamento

### Pagamento NÃO pago
- Pode ser:
  - apagado,
  - recriado,
  - sobrescrito,
desde que respeitada a unidade de idempotência.

### Pagamento com status `PAGO`
- **É imutável quanto a valor, tipo e competência.**
- Não pode ser:
  - apagado,
  - alterado por geração,
  - modificado por reprocesso.
- Só pode mudar por:
  - `PATCH /pagamentos/:id/pagar`
  - `PATCH /pagamentos/:id/estornar`

Qualquer tentativa de alterar um `Pagamento` pago por geração constitui **violação grave do Modelo A**.

---

## Ordem Oficial de Reprocessamento (por competência)

Ao reprocessar um mês para um prédio, a ord



Essa ordem garante:
- reprodutibilidade,
- ausência de duplicidade,
- preservação do histórico pago.

---

## Regras de Geração de Pagamento

- A geração de cobranças:
  - **nunca cria duplicatas** para a mesma unidade de idempotência.
  - deve:
    - atualizar ou ignorar Pagamentos NÃO pagos existentes,
    - **nunca tocar Pagamentos pagos**.
- A geração de despesas segue a mesma lógica.

A idempotência é **lógica**, mesmo que constraints físicas no banco sejam adicionadas apenas no futuro.

---

## O que é explicitamente proibido

Fica estabelecido que:

- ❌ Reprocessos não podem apagar `Pagamento` pago.
- ❌ Geração não pode alterar status `PAGO`.
- ❌ Recalcular não pode mudar valores pagos.
- ❌ Hotfix financeiro direto em banco é proibido.
- ❌ Criar múltiplos Pagamentos para a mesma unidade de idempotência é quebra do contrato.

---

## Justificativa

Essa decisão:

- elimina medo operacional,
- permite execução múltipla segura (cron, retries),
- separa claramente:
  - o que é descartável,
  - o que é histórico,
- protege KPIs e caixa,
- viabiliza automação futura.

Alternativas descartadas:
- recalcular tudo sempre (quebra histórico),
- bloquear reprocesso (inviabiliza correção),
- permitir edição manual de pagamentos (incontrolável).

---

## Consequências

### Positivas
- Reprocessar um mês é seguro e previsível.
- Falhas operacionais viram operações repetíveis.
- A arquitetura suporta múltiplas execuções sem dano.
- Facilita auditoria e explicação.

### Negativas / Trade-offs
- Exige disciplina para respeitar status `PAGO`.
- Adia para o futuro a implementação de constraints físicas no banco.

Os trade-offs são aceitos conscientemente.

---

## Status do legado

- Fluxos legados podem:
  - existir,
  - ser isolados,
mas **não** podem violar as regras de imutabilidade aqui definidas.
- Este ADR prevalece sobre qualquer fluxo antigo.

---

## Próximos passos (fora do escopo deste ADR)

- Implementar guards explícitos em services:
  - “não alterar pagamento pago”.
- Adicionar constraint única no banco quando apropriado.
- Criar testes de idempotência por competência.
- Implementar a Fase 3 (políticas do mês) respeitando este ADR.

---

## Conclusão

O sistema financeiro passa a operar com **idempotência explícita e segura**.

- `Pagamento` permanece como livro-razão único.
- O histórico pago é preservado.
- Reprocessos tornam-se operações normais, não riscos.

Esta decisão protege o sistema — e o futuro operador — contra inconsistências financeiras.
