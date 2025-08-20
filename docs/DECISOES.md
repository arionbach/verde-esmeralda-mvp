Perfeito 👌 Vamos criar a primeira versão do `docs/DECISOES.md`.
Esse documento será o **norte de arquitetura e decisões de design** do Projeto Verde Esmeralda. Ele deve ser atualizado a cada decisão estratégica.

Aqui vai a proposta inicial:

---

# 📑 DECISOES.md – Projeto Verde Esmeralda

## 🏛 Estrutura Geral

* Sistema multi-condomínios (**cada prédio = segregação financeira**).
* Baseado em **Next.js (App Router) + Prisma + PostgreSQL**.
* Deploy preparado para **crescimento modular** (financeiro, manutenção, relatórios).

---

## ✅ Decisões de Arquitetura

### 1. Segregação Financeira

* Cada prédio tem **CNPJ e conta próprios**.
* APIs financeiras **sempre filtradas por `predioId`**.
* **Nunca somar** receitas/despesas entre prédios.
* Relatórios comparativos apenas lado a lado (sem consolidar).

### 2. Gestão de Unidades

* Unidades são criadas **automaticamente** ao cadastrar prédio.
* Campo `quantidadeUnidades` define quantas unidades iniciais.
* Posteriormente, o síndico/admin configura cada unidade.
* Constraint: `unique([predioId, numero])`.

### 3. Dashboard

* **Dashboard Principal**: mostra lista de prédios ativos e métricas individuais.
* **Dashboard por Prédio**: métricas internas (ocupação, inadimplência, receita).
* Não existe visão global consolidada.

### 4. Exclusão e Histórico

* Exclusão é **soft delete**: unidade/prédio nunca removidos fisicamente.
* Mantém histórico financeiro e vínculos de pagamentos.

### 5. Permissões

* Síndico vê apenas **seu prédio**.
* Administradora vê todos os prédios (mas sempre separados).

---

## 🚧 Próximos Ciclos

* **Ciclo 4 – Unidades**: Refino automático + edição completa.
* **Ciclo 5 – Financeiro Básico**: Cobranças automáticas + relatórios.
* **Ciclo 6 – Relatórios e Permissões**: Perfis de acesso + comparativos.

---

Quer que eu já gere esse arquivo em formato **Markdown real (`.md`)** para você baixar e adicionar no repositório?
