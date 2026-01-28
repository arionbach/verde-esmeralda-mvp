# ADR-005 — Fechamento de Competência e Imutabilidade Temporal

**Status:** ACCEPTED  
**Data:** 2025-12-29  
**Contexto:** Sistema financeiro condominial — Modelo A (Condominial Real)  
**Decisores:** Arquitetura do domínio financeiro

---

## Contexto

O sistema financeiro opera por **competência mensal**, com:

- `Pagamento` como **livro-razão único**,
- `RateioItem` como memória de cálculo descartável,
- `AjusteUnidade` como políticas de cobrança por competência.

Com a evolução do sistema, torna-se necessário definir **quando uma competência deixa de ser mutável** e **o que passa a ser proibido após esse ponto**, para evitar:

- reprocessos acidentais de meses antigos,
- alterações retroativas de valores já consolidados,
- divergências históricas em relatórios,
- insegurança operacional (“posso mexer nesse mês?”).

Sem uma regra explícita de **fechamento de competência**, o sistema permanece tecnicamente correto, porém **temporalmente frágil**.

---

## Decisão

Foi decidido que o sistema adota o conceito de **Fechamento de Competência**, no qual:

- cada competência mensal pode estar **ABERTA** ou **FECHADA**,
- competências **fechadas tornam-se temporalmente imutáveis**,
- operações permitidas e proibidas passam a depender do estado da competência.

O fechamento é uma **decisão operacional explícita**, não automática.

---

## Definições

### Competência
- Período mensal normalizado (ex.: início do mês).
- Escopo de geração, cobrança, pagamento e KPI.

### Competência Aberta
- Pode ser recalculada.
- Permite:
  - apagar/recriar `RateioItem`,
  - apagar/recriar `AjusteUnidade`,
  - reemitir `Pagamento` **não pago**.

### Competência Fechada
- Considerada **consolidada**.
- Representa histórico financeiro estável.
- Não pode ser alterada por geração ou reprocesso.

---

## Regra de Fechamento

Uma competência é considerada **FECHADA** quando ocorre **qualquer uma das condições abaixo** (política do sistema):

- decisão administrativa explícita (ação futura),
- ou passagem de um marco operacional definido (ex.: fechamento mensal),
- ou critério temporal definido (ex.: competência anterior ao mês corrente).

> A forma exata de fechamento **não é definida neste ADR**, apenas seus efeitos.

---

## Regras por Entidade após Fechamento

### RateioItem
- ❌ Proibido recalcular
- ❌ Proibido apagar
- Estado congelado

### AjusteUnidade
- ❌ Proibido criar, alterar ou apagar
- Políticas do mês tornam-se históricas

### Pagamento NÃO pago
- ❌ Proibido apagar
- ❌ Proibido alterar valor, tipo ou competência
- Pode:
  - ser pago,
  - ser estornado (se já pago antes do fechamento)

### Pagamento PAGO
- Já é imutável por definição (ADR-004)
- Fechamento reforça a imutabilidade temporal

---

## Operações Permitidas em Competência Fechada

Mesmo após o fechamento, **algumas operações continuam permitidas**:

- `PATCH /pagamentos/:id/pagar`
- `PATCH /pagamentos/:id/estornar`
- Consultas:
  - KPIs,
  - extratos,
  - relatórios históricos

Essas operações **não alteram o valor histórico**, apenas o estado de caixa.

---

## Operações Explicitamente Proibidas

Após o fechamento de uma competência, fica proibido:

- ❌ Reprocessar rateio
- ❌ Reaplicar políticas do mês
- ❌ Reemitir cobranças
- ❌ Ajustar valores retroativos
- ❌ Corrigir “no passado” via geração

Qualquer tentativa caracteriza **violação de imutabilidade temporal**.

---

## Relação com ADRs Anteriores

- **ADR-003** define *onde* políticas entram.
- **ADR-004** define *como* reprocessar com segurança.
- **ADR-005** define *até quando* é permitido reprocessar.

Após o fechamento:
- ADR-004 deixa de ser aplicável àquela competência.
- A competência passa a ser **somente leitura estrutural**.

---

## Justificativa

Essa decisão:

- protege o histórico financeiro,
- garante consistência temporal de relatórios,
- evita regressões silenciosas,
- separa claramente:
  - período operacional,
  - período histórico.

Alternativas descartadas:
- permitir reprocesso infinito (instabilidade),
- travar tudo sempre (inviável),
- depender de disciplina humana informal.

---

## Consequências

### Positivas
- O passado deixa de “se mexer”.
- Relatórios antigos tornam-se confiáveis.
- Reduz ansiedade operacional.
- Facilita auditoria e explicação histórica.

### Negativas / Trade-offs
- Correções tardias exigem lançamentos compensatórios no presente.
- Exige aceitação de que erros antigos não são “consertados”, apenas compensados.

Os trade-offs são considerados aceitáveis.

---

## Status do legado

- Fluxos legados não podem violar fechamento de competência.
- Este ADR prevalece sobre qualquer comportamento histórico permissivo.

---

## Próximos passos (fora do escopo deste ADR)

- Definir mecanismo de marcação de competência como FECHADA.
- Implementar guards nos services:
  - “competência fechada → somente leitura”.
- Criar estratégia de lançamentos compensatórios.
- Documentar procedimento operacional de fechamento mensal.

---

## Conclusão

O sistema financeiro passa a ter **imutabilidade temporal explícita**.

- O presente é operacional.
- O passado é histórico.
- O futuro é previsível.

Esta decisão completa o arcabouço do Modelo A para operação real em produção.
