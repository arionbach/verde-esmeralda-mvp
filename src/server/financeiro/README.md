# Domínio Financeiro — README

Este documento descreve responsabilidades e invariantes do domínio financeiro para humanos e agentes de IA.

## Invariantes do Modelo (Modelo Financeiro A)
- Livro‑razão oficial: `Pagamento`.
- Receita oficial deriva exclusivamente de `Pagamento` (nunca de cadastros como `DespesaFixa` ou `valorTaxa`).
- KPIs (previsto/realizado), inadimplência e quaisquer consolidações derivam de `Pagamento`.

## Competência (sempre explícita)
- Toda operação financeira recebe competência explícita (`YYYY-MM`) ou `startOfMonth`.
- Parsing/normalização centralizados nos services (ex.: `parseCompetencia`).

## Decimal interno; number apenas no boundary
- Cálculos e valores monetários usam `Prisma.Decimal` internamente nos services.
- Conversão para `number` ocorre somente no boundary (rotas/DTOs) para compatibilidade com clientes.

## Fronteiras: route.ts delega, services decidem
- `route.ts`:
  - valida/parsing mínimo;
  - coleta parâmetros;
  - delega aos services;
  - converte Decimals para number se necessário.
- `services`:
  - contêm regras de negócio e acesso ao banco (Prisma);
  - mantêm as invariantes do domínio financeiro.
- `agents`:
  - orquestram fluxos e chamam apenas services (nunca Prisma diretamente).

## ADR‑007 (fechamento de competência)
- Regra executável de governança operacional.
- Impede fechamento duplicado e reabertura sem deliberação explícita.
- Mantém auditoria mínima: `fechadaEm`, `fechadaPor`.

## Estrutura atual do domínio
- `financeiro.service.ts`: regras financeiras (KPIs, geração, listagens, helpers de competência/decimal) baseadas em `Pagamento`.
- `competencia-status.service.ts`: governança de status de competência (ADR‑007).

## Anti‑padrões
- Não calcular receita a partir de cadastros (ex.: `valorTaxa`).
- Não realizar cálculos financeiros não triviais dentro de `route.ts`.
- Não acessar Prisma em agents.

