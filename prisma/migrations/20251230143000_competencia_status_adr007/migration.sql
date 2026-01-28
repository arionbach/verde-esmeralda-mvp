-- ADR-007: CompetenciaStatus minimal table + enum
CREATE TYPE "CompetenciaStatusFlag" AS ENUM ('ABERTA', 'FECHADA');

CREATE TABLE "CompetenciaStatus" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "predioId" TEXT NOT NULL,
  "competencia" TIMESTAMP(3) NOT NULL,
  "status" "CompetenciaStatusFlag" NOT NULL DEFAULT 'ABERTA',
  "fechadaEm" TIMESTAMP(3),
  "fechadaPor" TEXT
);

CREATE INDEX "CompetenciaStatus_predio_comp_idx" ON "CompetenciaStatus"("predioId", "competencia");
CREATE UNIQUE INDEX "CompetenciaStatus_predio_comp_ux" ON "CompetenciaStatus"("predioId", "competencia");

