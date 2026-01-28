# Governança para Humanos e IA

Este guia define guardrails práticos para evolução segura do sistema por pessoas e agentes.

## Princípios de Governança
- Modelo Financeiro A: `Pagamento` é o livro‑razão oficial.
- Receita oficial deriva exclusivamente de `Pagamento`.
- `route.ts` delega; `service` decide.
- Competência sempre explícita (string `YYYY-MM` ou `startOfMonth`).
- Decimal interno; conversão para `number` apenas no boundary da API.
- ADR‑007 é regra executável (aplicada via service de competência).

## Regras Operacionais
- Services mantêm `Prisma.Decimal` e convertem apenas nos boundaries (ex.: rota/DTO).
- Services não retornam números arredondados sem necessidade; arredondamentos/formatos ficam no boundary/UI.
- Agents não acessam Prisma; somente services.
- Toda lógica financeira não trivial pertence aos services; rotas são orquestradoras finas.

## Competência (ADR‑007)
- Fechar uma competência cria/atualiza status com auditoria (`fechadaEm`, `fechadaPor`).
- Fechamento duplicado é inválido; reabertura é inválida (sem deliberação explícita formalizada em ADR futura).

## Anti‑Padrões (não fazer)
- Não usar cadastros (ex.: `DespesaFixa`, `valorTaxa`) como fonte de verdade de receita.
- Não fazer somatórios monetários com `number` dentro de services.
- Não adicionar validação/políticas nas rotas; isso quebra a governança.

## Como introduzir mudanças
1. Especificar a competência e o impacto sobre o livro‑razão.
2. Colocar a lógica em um service focado (sem abstrações genéricas).
3. Preservar `Decimal` internamente; converter na borda.
4. Ajustar rotas para delegar ao novo service sem alterar contratos.
5. Atualizar este documento e o `MAPA_SEMANTICO.md` quando novas regras/invariantes surgirem.

