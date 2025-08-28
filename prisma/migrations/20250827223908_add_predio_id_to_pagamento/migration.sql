/*
  Warnings:

  - A unique constraint covering the columns `[manutencaoId,numeroParcela]` on the table `Pagamento` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `predioId` to the `Pagamento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Pagamento" ADD COLUMN     "predioId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Pagamento_manutencao_idx" ON "public"."Pagamento"("manutencaoId", "numeroParcela");

-- CreateIndex
CREATE INDEX "Pagamento_tipo_comp_idx" ON "public"."Pagamento"("tipo", "competencia");

-- CreateIndex
CREATE INDEX "Pagamento_unidade_venc_idx" ON "public"."Pagamento"("unidadeId", "dataVencimento");

-- CreateIndex
CREATE INDEX "Pagamento_predioId_idx" ON "public"."Pagamento"("predioId");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_manutencao_parcela_ux" ON "public"."Pagamento"("manutencaoId", "numeroParcela");

-- AddForeignKey
ALTER TABLE "public"."Pagamento" ADD CONSTRAINT "Pagamento_predioId_fkey" FOREIGN KEY ("predioId") REFERENCES "public"."Predio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
