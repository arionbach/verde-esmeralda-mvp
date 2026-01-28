# Baseline Arquitetural — Verde Esmeralda (Modelo A)

## 1) Objetivo
Sistema de gestão condominial com foco em financeiro confiável por competência, evitando múltiplas fontes de verdade.

## 2) Público-alvo
Síndico e administradora, com segregação por prédio e autoridade operacional/financeira.

## 3) Contratos do Modelo A (Invariantes)
- `Pagamento` é o livro-razão único. KPIs derivam exclusivamente dele. (ADR-001)
- Competência mensal é o eixo temporal absoluto. (ADR-002)
- `RateioItem` é memória descartável de cálculo.
- `AjusteUnidade` representa políticas/exceções por competência e unidade.
- Idempotência por competência e unidade de unicidade lógica; pagamento PAGO é imutável. (ADR-004)
- Competência FECHADA torna dados estruturais somente-leitura; correções via lançamentos compensatórios. (ADR-005)
- Políticas identificadas semanticamente por `tipoPolitica` (ENUM), não por texto. (ADR-006)

## 4) Pipeline oficial
1. calcularRateioFixas -> RateioItem (descartável)
2. calcularPoliticasDoMes -> AjusteUnidade (descartável, semântica via tipoPolitica)
3. gerarCobrancasPorRateio -> Pagamento(TAXA_MENSAL)
4. Operação de caixa -> pagar/estornar
5. KPIs -> Resumo V3 (somente Pagamento)

## 5) Governança temporal
- Competência ABERTA: permite recalcular rateio/políticas e reemitir pagamentos não pagos
- Competência FECHADA: bloqueia operações estruturais; permite pagar/estornar e consultas
(ADR-007 operacionaliza e ADR-005 define efeitos)

## 6) Fora de escopo (por ora)
- Conciliação bancária
- Integrações bancárias / boletos
- Contabilidade fiscal e impostos

## 7) Pontos a confirmar
- Política de reabertura de competência (permitida/proibida e condições)
- Nível de auditoria exigido (assembleia / export / auditoria externa)
- Horizonte de integrações bancárias e boletos
- Regras futuras de juros/multa (quando entrarem)
