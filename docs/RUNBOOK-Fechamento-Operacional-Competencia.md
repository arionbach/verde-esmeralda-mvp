# RUNBOOK — Fechamento Operacional de Competência (ADR-007)

Este runbook descreve o procedimento operacional para aplicar o Fechamento de Competência conforme ADR-007. Não altera dados financeiros; apenas governa quando operações estruturais podem ocorrer.

## 1) Abrir competência (default)
- Não é necessário fazer nada.
- Se não existir registro em CompetenciaStatus, a competência é tratada como ABERTA.

## 2) Fechar competência (manual, seguro)
Via script/console/Prisma Studio:

```sql
INSERT INTO "CompetenciaStatus"
  ("predioId", "competencia", "status", "fechadaEm", "fechadaPor")
VALUES
  ('<predioId>', '2025-12-01', 'FECHADA', NOW(), '<usuario>')
ON CONFLICT ("predioId", "competencia")
DO UPDATE SET
  status = 'FECHADA',
  fechadaEm = NOW(),
  fechadaPor = EXCLUDED."fechadaPor";
```

Boas práticas:
- Sempre usar startOfMonth (YYYY-MM-01)
- Preencher fechadaPor (email/login/ID)

## 3) O que acontece após FECHADA
- Rateio: Bloqueado
- Políticas: Bloqueado
- Cobrança: Bloqueado
- Resumo/KPIs: Permitido
- Consulta de pagamentos: Permitido

Logs esperados:
- `[fechamento][rateio-fixas] competência fechada`
- `[fechamento][cobrancas-por-rateio] competência fechada`
- `[fechamento][despesas-fixas] competência fechada`

## 4) Smoke técnico (30 segundos)
1. Marcar competência como FECHADA (comando acima)
2. Tentar:
   - `POST /api/predios/:id/financeiro/rateio/fixas?competencia=YYYY-MM`
   - `POST /api/predios/:id/financeiro/mensalidades/gerar-por-rateio?competencia=YYYY-MM`
3. Esperar:
   - Erro explícito de competência fechada
   - Nenhum dado alterado (RateioItem/AjusteUnidade/Pagamento)
4. Consultar:
   - `GET /api/predios/:id/financeiro/resumo-v3?competencia=YYYY-MM` (funciona normalmente)

Governança validada.
