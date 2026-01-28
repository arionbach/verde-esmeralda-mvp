# Camada de Services — README

Este diretório contém services de backend. Padrões gerais:

- `route.ts` delega; services decidem.
- Services encapsulam regras de negócio e acesso a dados (Prisma).
- Cálculos monetários com `Prisma.Decimal` internamente; conversão para `number` apenas no boundary da API.
- Competência sempre explícita em operações financeiras (string `YYYY-MM` ou `startOfMonth`).
- Agents orquestram fluxos e chamam apenas services.

Para o domínio financeiro, veja `./financeiro/README.md`.

