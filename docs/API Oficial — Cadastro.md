# API Oficial — Cadastro (Fonte da Verdade)

## Contexto

Este sistema é **interno para administradora**, com suporte a **múltiplos prédios**. O **Prédio é o agregado raiz** do domínio: todos os recursos de cadastro devem ser **contextualizados por `/predios/:predioId`**. A regra central é manter **uma única fonte de verdade por recurso**, evitando rotas paralelas com contratos diferentes.

---

## Rotas Oficiais

As rotas abaixo são as **únicas fontes de verdade** para cadastro.

### Prédios

* **GET /api/predios** — Lista prédios cadastrados.
* **POST /api/predios** — Cria um novo prédio.
* **GET /api/predios/:predioId** — Obtém dados de um prédio específico.
* **PUT /api/predios/:predioId** — Atualiza dados do prédio.
* **DELETE /api/predios/:predioId** — Remove o prédio (preferencialmente via soft delete).

### Unidades

* **GET /api/predios/:predioId/unidades** — Lista unidades do prédio.
* **POST /api/predios/:predioId/unidades** — Cria uma unidade vinculada ao prédio.
* **PUT /api/predios/:predioId/unidades/:unidadeId** — *A definir (rota oficial ainda não consolidada).*
* **DELETE /api/predios/:predioId/unidades/:unidadeId** — *A definir (rota oficial ainda não consolidada).*

### Responsáveis

* **GET /api/predios/:predioId/unidades/:unidadeId/responsaveis** — Lista responsáveis da unidade.
* **POST /api/predios/:predioId/unidades/:unidadeId/responsaveis** — Cria responsável vinculado à unidade.
* **PUT /api/predios/:predioId/unidades/:unidadeId/responsaveis/:responsavelId** — *A definir (rota oficial ainda não consolidada).*
* **DELETE /api/predios/:predioId/unidades/:unidadeId/responsaveis/:responsavelId** — *A definir (rota oficial ainda não consolidada).*

---

## Rotas DEPRECATED

As rotas abaixo **não são mais oficiais**. Devem **logar uso** e serão removidas após migração completa da UI.

* **/api/unidades/:id** — CRUD global de unidade sem contexto de prédio; viola o agregado raiz.
* **/api/unidades/:id/responsaveis** — Cadastro de responsáveis fora do contexto do prédio; pode gerar inconsistências.

---

## Contrato da API (Borda)

* **Responses para a UI** retornam campos como `tipo` e `status` em **lowercase**.
* **Inputs** aceitam valores em lowercase e são **normalizados** para enums do Prisma.
* A **normalização acontece na borda** (handlers/serializers da API), **não no domínio** (services/modelos).

---

## Regras de Integridade Mínimas

* Uma **Unidade pertence a um Prédio**.
* Um **Responsável pertence a uma Unidade**.
* Deve existir **apenas 1 responsável ativo** com `ehTitularCobranca = true` **por unidade** (invariante de cobrança).

---

## Notas de Roadmap

* **Multi-tenant**: adicionar `administradoraId` em `Predio` para suportar múltiplas administradoras.
* **Soft delete** como padrão para entidades de cadastro, evitando hard delete sempre que possível.
