# Mapa Semântico do Sistema Financeiro (Modelo A)

Este documento torna explícitas as regras, fronteiras e invariantes do domínio financeiro adotado neste projeto.

## Núcleo do Modelo (Livro-Razão)
- Livro-razão oficial: `Pagamento`.
- Receita oficial deriva exclusivamente de `Pagamento`.
- KPI, previsto/realizado, inadimplência e qualquer consolidação devem ser derivados de `Pagamento` (nunca diretamente de cadastros como `DespesaFixa`).

## Fronteiras e Responsabilidades
- `route.ts` delega; `service` decide.
  - Rotas apenas validam/parsing mínimo, coletam parâmetros e chamam services.
  - Services encapsulam regras de negócio e acesso ao banco (via Prisma).
- Agents: orquestram fluxos e chamam apenas services (nunca Prisma diretamente).

## Competência (Obrigatória e Explícita)
- Competência sempre explícita em operações financeiras (string `YYYY-MM` ou `startOfMonth`).
- Normalização/parsing centralizados nos services (ex.: `parseCompetencia`).

## Decimal e Boundaries
- Cálculos e valores monetários usam `Prisma.Decimal` internamente nos services.
- Conversão para `number` ocorre somente no boundary da API (nas rotas), mantendo compatibilidade com clientes.

## ADR-007 (Fechamento de Competência)
- Regra executável: fechamento/reabertura governado por service dedicado.
- Fechamento duplicado é bloqueado; reabertura é bloqueada (sem deliberação explícita formalizada).
- Auditoria mínima preservada: `fechadaEm`, `fechadaPor`.

## Anti‑Padrões (não fazer)
- Não calcular receita a partir de cadastros (ex.: `valorTaxa`); receita oficial vem de `Pagamento`.
- Não realizar cálculos financeiros não triviais dentro de `route.ts`.
- Não acessar Prisma direto em agents.

## Glossário Rápido
- Pagamento: entidade única para receitas/despesas; base de KPIs.
- Competência: janela mensal financeira (normalizada para o primeiro dia do mês, UTC).
- Previsto vs Realizado: ambos derivados de `Pagamento` (por status e tipo).

