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


Decisão: Despesa Fixa com dia de vencimento próprio

Contexto
Síndicos e administradoras lidam com despesas recorrentes do condomínio (portaria, limpeza, elevador, seguros, internet, energia etc.) cujos vencimentos são definidos por fornecedores e frequentemente não coincidem com o vencimento da taxa condominial.

Decisão
O domínio de Despesa Fixa passa a possuir um campo obrigatório diaVencimento (1..28), que define o dia do mês em que o lançamento da competência vence.

Justificativa

Reflete fielmente a operação real do condomínio.

Facilita planejamento de caixa e visualização de atrasos.

Evita concentração artificial de vencimentos.

Alinha o modelo mental do usuário com o sistema.

Impacto no Domínio

DespesaFixa possui vigência por competência (início/fim) e diaVencimento.

Gera Pagamento do tipo DESPESA_FIXA, com predioId preenchido e unidadeId nulo.

O vencimento do pagamento é calculado a partir de (competência, diaVencimento).

A idempotência mensal é garantida por (despesaFixaId, competencia).

Estado Atual do Código

UI, schemas de API e geração de lançamentos já assumem a existência de diaVencimento.

O schema Prisma ainda não reflete essa decisão, gerando desalinhamentos.

Pendências Técnicas

Incluir diaVencimento no schema Prisma de DespesaFixa.

Alinhar nomenclatura de vigência (inicio/fim vs dataInicio/dataFim).

Unificar o uso de Prisma e SQL manual nos serviços.

Revisar obrigatoriedade de categoria no domínio.

Nota
Esta decisão consolida oficialmente um comportamento já existente no sistema, reduzindo ambiguidade e preparando o terreno para ajustes incrementais seguros.

 ## Despesa Fixa com dia de vencimento próprio                                                                                                                                                     
                                                                                                                                                                                                    
  Contexto                                                                                                                                                                                          
                                                                                                                                                                                                    
  - Havia desalinhamento entre o domínio, o schema Prisma e partes do código:                                                                                                                       
      - O domínio e a UI/API já tratam despesa fixa com um “dia de vencimento” específico (diaVencimento).                                                                                          
      - Os services usam diaVencimento para gerar a data de vencimento do Pagamento.                                                                                                                
      - O schema Prisma atual não possui o campo diaVencimento em DespesaFixa, e a vigência está nomeada como inicio/fim (mapeada para as colunas competenciaInicio/competenciaFim), enquanto       
  serviços/rotas usam dataInicio/dataFim.                                                                                                                                                           
      - Categoria é obrigatória no Prisma, mas opcional na API/UI.                                                                                                                                  
                                                                                                                                                                                                    
  Decisão                                                                                                                                                                                           
                                                                                                                                                                                                    
  - Despesa Fixa possui dia de vencimento próprio (diaVencimento), independente do vencimento da taxa condominial das unidades.                                                                     
                                                                                                                                                                                                    
  Justificativa (uso real)                                                                                                                                                                          
                                                                                                                                                                                                    
  - Em condomínio, contratos e serviços recorrentes (portaria, limpeza, elevador, seguros, internet, energia de áreas comuns, etc.) possuem vencimentos definidos pelo fornecedor, frequentemente   
  diferentes entre si e do dia da taxa condominial.                                                                                                                                                 
  - Ter vencimento por despesa facilita previsibilidade de caixa, evita concentração de pagamentos em uma única data e reflete práticas de negociação com cada fornecedor.                          
  - É a forma com melhor aderência ao trabalho cotidiano de síndicos e administradoras.                                                                                                             
                                                                                                                                                                                                    
  Impacto no domínio                                                                                                                                                                                
                                                                                                                                                                                                    
  - DespesaFixa                                                                                                                                                                                     
      - Passa a ter campo diaVencimento (inteiro de 1 a 28) que determina o dia de vencimento do lançamento mensal na competência.                                                                  
      - Mantém vigência por competência (inicio/fim) e flag de ativo.                                                                                                                               
  - Pagamento                                                                                                                                                                                       
      - Lançamentos originados de despesa fixa têm tipo = DESPESA_FIXA, predioId preenchido, e unidadeId intencionalmente nulo (lançamento do prédio).                                              
      - vencimento do Pagamento é calculado a partir de (competência, diaVencimento).                                                                                                               
      - Idempotência mensal garantida por (despesaFixaId, competencia).                                                                                                                             
                                                                                                                                                                                                    
  Impacto técnico                                                                                                                                                                                   
                                                                                                                                                                                                    
  - Prisma                                                                                                                                                                                          
      - Incluir campo diaVencimento em DespesaFixa (Int). Validação de 1..28 continua na camada de API/UI.                                                                                          
      - Vigência permanece com inicio/fim (@map para competenciaInicio/competenciaFim).                                                                                                             
  - Services                                                                                                                                                                                        
      - Rotina de geração mensal (gerarLancamentosDespesasFixas) já calcula vencimento usando diaVencimento e aplica idempotência por competência.                                                  
      - Consulta de vigência na competência já existe (janela inicio/fim).                                                                                                                          
  - API                                                                                                                                                                                             
      - Schemas de criação/atualização já exigem diaVencimento (1..28) e tratam vigência (dataInicio/dataFim).                                                                                      
      - Rotas de geração por competência preservam a idempotência.                                                                                                                                  
  - UI                                                                                                                                                                                              
      - CRUD de despesa fixa já expõe/edita diaVencimento, além do acionamento da geração por competência.                                                                                          
                                                                                                                                                                                                    
  Pendências técnicas conhecidas                                                                                                                                                                    
                                                                                                                                                                                                    
  - Prisma                                                                                                                                                                                          
      - Adicionar o campo diaVencimento a DespesaFixa (tipo Int). Opcional: CHECK 1 ≤ diaVencimento ≤ 28 no banco.                                                                                  
  - Alinhamento de vigência                                                                                                                                                                         
      - Serviços/rotas/UI usam dataInicio/dataFim; Prisma expõe inicio/fim (@map para competenciaInicio/competenciaFim). É necessário uniformizar a nomenclatura de contrato x persistência quando  
  oportuno.                                                                                                                                                                                         
  - Categoria                                                                                                                                                                                       
      - É obrigatória no Prisma (String não nula) e opcional/null na API/UI. Monitorar inserções/atualizações para evitar violações.                                                                
  - Prisma vs SQL “fallback”                                                                                                                                                                        
      - Existem trechos que alternam entre Prisma e SQL manual, com vocabulários de campo distintos; consolidar a fonte de verdade mitigará ambiguidades.                                           
  - KPIs
  - getResumoV2 soma despesas fixas do mês a partir de DespesaFixa ativa (janela de competência), e não necessariamente a partir dos Pagamentos gerados. Confirmar se essa é a métrica desejada

## Nota Fase 1 (Modelo A — Condominial Real)

- Desde vX.Y, os KPIs oficiais do financeiro passam a ser calculados exclusivamente a partir de `Pagamento` (livro‑razão único), via `getResumoV3`.
- O bloco `kpis` anterior permanece apenas para compatibilidade temporária (deprecated). A UI seguirá migrada para os blocos `kpisPrevisto` e `kpisRealizado`.
  a longo prazo.                   
y