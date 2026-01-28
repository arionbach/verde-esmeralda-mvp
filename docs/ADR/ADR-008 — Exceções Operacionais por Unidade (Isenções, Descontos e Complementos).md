ADR-008 — Exceções Operacionais por Unidade (Isenções, Descontos e Complementos)

Status: PROPOSTO
Data: 2025-12-30
Decisores: Arquitetura Financeira
Contexto relacionado: ADR-003, ADR-005, ADR-006, ADR-007

Contexto

No modelo condominial real, situações excepcionais ocorrem com frequência:

Isenção temporária de cobrança para uma unidade

Desconto negociado (acordo, erro anterior, compensação)

Complemento manual (ajuste excepcional, cobrança retroativa)

Essas exceções não fazem parte do rateio de despesas, mas afetam diretamente o valor cobrado da unidade em uma competência específica.

Historicamente, sistemas tratam exceções de forma incorreta:

Editando mensalidades diretamente

Alterando valores de rateio

Criando despesas fictícias

Perdendo rastreabilidade e auditabilidade

O Modelo A exige que:

O rateio permaneça puro e reprodutível

O livro-razão (Pagamento) continue sendo a única fonte de KPIs

Exceções sejam explícitas, auditáveis e reversíveis

Decisão

Todas as exceções operacionais por unidade devem ser representadas exclusivamente por registros em AjusteUnidade, usando identificação semântica clara.

Nenhuma exceção:

altera RateioItem

altera Pagamento diretamente

cria despesas artificiais

Tipos de Exceção

As exceções são classificadas semanticamente via:

tipoPolitica = EXCECAO


E diferenciadas por natureza:

Caso	natureza	efeito
Isenção	CREDITO	reduz cobrança
Desconto	CREDITO	reduz cobrança
Complemento	DEBITO	aumenta cobrança
Ajuste manual	CREDITO ou DEBITO	conforme regra
Modelo de Dados (existente)

Utiliza AjusteUnidade, já disponível:

predioId

unidadeId

competencia (startOfMonth)

tipoPolitica = EXCECAO

natureza = CREDITO | DEBITO

valor (Decimal)

descricao (auditável)

createdAt

Nenhuma nova entidade é introduzida.

Invariantes Arquiteturais

RateioItem nunca representa exceções

Pagamento nunca é alterado manualmente

Toda exceção é explícita e rastreável

Reexecução do pipeline é segura

Exceções não se propagam para outras competências

KPIs continuam derivando apenas de Pagamento

Idempotência

Cada exceção é identificada por:

(predioId, unidadeId, competencia, tipoPolitica = EXCECAO, descricao)


Não há reprocessamento automático

Exceções são decisões humanas explícitas

Reversão ocorre criando ajuste oposto (novo registro)

Integração no Pipeline

As exceções entram no mesmo ponto das políticas financeiras:

calcularRateioFixas
→ calcularPoliticasDoMes
   → TAXA_MINIMA
   → FUNDO_RESERVA
   → EXCECOES (manuais)
→ gerarCobrancasPorRateio


O serviço não cria exceções automaticamente.
Apenas consome AjusteUnidade existentes.

Governança Temporal (ADR-007)

Exceções não podem ser criadas ou alteradas em competência FECHADA

A tentativa deve falhar explicitamente

Leitura é permitida

O que este ADR NÃO faz

Não define UI

Não define permissões

Não define workflow de aprovação

Não cria automação

Não altera contratos existentes

Consequências
Positivas

Modelo A preservado

Auditoria clara

Histórico confiável

Reprocessamento seguro

Alinhamento com prática condominial real

Negativas / Trade-offs

Mais registros explícitos

Exige disciplina operacional

Exceções não “somem sozinhas”

Decisão Final

GO para exceções operacionais exclusivamente via AjusteUnidade, usando tipoPolitica = EXCECAO, respeitando fechamento de competência e sem tocar RateioItem ou Pagamento.