/*
  Warnings:

  - You are about to alter the column `valorTotal` on the `Manutencao` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.
  - You are about to alter the column `valorParcela` on the `Manutencao` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.
  - The `status` column on the `Manutencao` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `valor` on the `Pagamento` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.
  - The `status` column on the `Pagamento` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tipo` column on the `Responsavel` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `tipo` column on the `Unidade` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Unidade` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `valorTaxa` on the `Unidade` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(14,2)`.
  - Changed the type of `tipo` on the `Pagamento` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."UnidadeTipo" AS ENUM ('APARTAMENTO', 'COBERTURA', 'LOJA', 'GARAGEM');

-- CreateEnum
CREATE TYPE "public"."UnidadeStatus" AS ENUM ('OCUPADO', 'VAZIO');

-- CreateEnum
CREATE TYPE "public"."ResponsavelTipo" AS ENUM ('PROPRIETARIO', 'INQUILINO');

-- CreateEnum
CREATE TYPE "public"."ManutencaoStatus" AS ENUM ('ATIVA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."PagamentoTipo" AS ENUM ('TAXA_MENSAL', 'MANUTENCAO');

-- CreateEnum
CREATE TYPE "public"."PagamentoStatus" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "public"."Manutencao" ALTER COLUMN "valorTotal" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "valorParcela" SET DATA TYPE DECIMAL(14,2),
DROP COLUMN "status",
ADD COLUMN     "status" "public"."ManutencaoStatus" NOT NULL DEFAULT 'ATIVA';

-- AlterTable
ALTER TABLE "public"."Pagamento" ADD COLUMN     "competencia" TIMESTAMP(3),
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "public"."PagamentoTipo" NOT NULL,
ALTER COLUMN "valor" SET DATA TYPE DECIMAL(14,2),
DROP COLUMN "status",
ADD COLUMN     "status" "public"."PagamentoStatus" NOT NULL DEFAULT 'PENDENTE';

-- AlterTable
ALTER TABLE "public"."Responsavel" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "ehTitularCobranca" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "public"."ResponsavelTipo" NOT NULL DEFAULT 'PROPRIETARIO';

-- AlterTable
ALTER TABLE "public"."Unidade" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "numeroInt" INTEGER,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "public"."UnidadeTipo" NOT NULL DEFAULT 'APARTAMENTO',
DROP COLUMN "status",
ADD COLUMN     "status" "public"."UnidadeStatus" NOT NULL DEFAULT 'OCUPADO',
ALTER COLUMN "valorTaxa" SET DATA TYPE DECIMAL(14,2);

-- CreateIndex
CREATE INDEX "Pagamento_unidadeId_competencia_idx" ON "public"."Pagamento"("unidadeId", "competencia");

-- CreateIndex
CREATE INDEX "Pagamento_status_dataVencimento_idx" ON "public"."Pagamento"("status", "dataVencimento");

-- CreateIndex
CREATE INDEX "Responsavel_unidadeId_ativo_idx" ON "public"."Responsavel"("unidadeId", "ativo");

-- CreateIndex
CREATE INDEX "Responsavel_unidadeId_ehTitularCobranca_ativo_idx" ON "public"."Responsavel"("unidadeId", "ehTitularCobranca", "ativo");

-- CreateIndex
CREATE INDEX "Unidade_predioId_numeroInt_idx" ON "public"."Unidade"("predioId", "numeroInt");

-- CreateIndex
CREATE INDEX "Unidade_predioId_ativo_idx" ON "public"."Unidade"("predioId", "ativo");
