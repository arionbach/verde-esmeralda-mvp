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
  - A unique constraint covering the columns `[manutencaoId,numeroParcela]` on the table `Pagamento` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[despesaFixaId,competencia]` on the table `Pagamento` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `predioId` to the `Pagamento` table without a default value. This is not possible if the table is not empty.
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
CREATE TYPE "public"."PagamentoTipo" AS ENUM ('TAXA_MENSAL', 'MANUTENCAO', 'DESPESA_FIXA');

-- CreateEnum
CREATE TYPE "public"."PagamentoStatus" AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."RegraRateio" AS ENUM ('IGUAL', 'FRACAO_IDEAL', 'VALOR_FIXO_POR_UNIDADE');

-- CreateEnum
CREATE TYPE "public"."OrigemRateio" AS ENUM ('DESPESA_FIXA', 'DESPESA_VARIAVEL', 'MANUTENCAO', 'AJUSTE_UNIDADE');

-- CreateEnum
CREATE TYPE "public"."NaturezaLancamento" AS ENUM ('DEBITO', 'CREDITO');

-- AlterTable
ALTER TABLE "public"."Manutencao" ALTER COLUMN "valorTotal" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "valorParcela" SET DATA TYPE DECIMAL(14,2),
DROP COLUMN "status",
ADD COLUMN     "status" "public"."ManutencaoStatus" NOT NULL DEFAULT 'ATIVA';

-- AlterTable
ALTER TABLE "public"."Pagamento" ADD COLUMN     "competencia" TIMESTAMP(3),
ADD COLUMN     "despesaFixaId" TEXT,
ADD COLUMN     "predioId" TEXT NOT NULL,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "public"."PagamentoTipo" NOT NULL,
ALTER COLUMN "valor" SET DATA TYPE DECIMAL(14,2),
DROP COLUMN "status",
ADD COLUMN     "status" "public"."PagamentoStatus" NOT NULL DEFAULT 'PENDENTE',
ALTER COLUMN "unidadeId" DROP NOT NULL;

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

-- CreateTable
CREATE TABLE "public"."DespesaFixa" (
    "id" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "rateio" "public"."RegraRateio" NOT NULL DEFAULT 'IGUAL',
    "competenciaInicio" TIMESTAMP(3) NOT NULL,
    "competenciaFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DespesaFixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DespesaFixaValorPorUnidade" (
    "id" TEXT NOT NULL,
    "despesaId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "DespesaFixaValorPorUnidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DespesaVariavel" (
    "id" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "rateio" "public"."RegraRateio" NOT NULL DEFAULT 'IGUAL',
    "competencia" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DespesaVariavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AjusteUnidade" (
    "id" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "natureza" "public"."NaturezaLancamento" NOT NULL DEFAULT 'CREDITO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AjusteUnidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RateioItem" (
    "id" TEXT NOT NULL,
    "predioId" TEXT NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "origemTipo" "public"."OrigemRateio" NOT NULL,
    "origemId" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "natureza" "public"."NaturezaLancamento" NOT NULL DEFAULT 'DEBITO',
    "criadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateioItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DespesaFixa_predioId_ativo_idx" ON "public"."DespesaFixa"("predioId", "ativo");

-- CreateIndex
CREATE INDEX "DespesaFixa_predioId_competenciaInicio_competenciaFim_idx" ON "public"."DespesaFixa"("predioId", "competenciaInicio", "competenciaFim");

-- CreateIndex
CREATE INDEX "DespesaFixa_predioId_categoria_ativo_idx" ON "public"."DespesaFixa"("predioId", "categoria", "ativo");

-- CreateIndex
CREATE INDEX "DespesaFixaValorPorUnidade_unidadeId_idx" ON "public"."DespesaFixaValorPorUnidade"("unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "DespesaFixaValorPorUnidade_despesaId_unidadeId_key" ON "public"."DespesaFixaValorPorUnidade"("despesaId", "unidadeId");

-- CreateIndex
CREATE INDEX "DespesaVariavel_predioId_competencia_idx" ON "public"."DespesaVariavel"("predioId", "competencia");

-- CreateIndex
CREATE INDEX "AjusteUnidade_predioId_competencia_idx" ON "public"."AjusteUnidade"("predioId", "competencia");

-- CreateIndex
CREATE INDEX "AjusteUnidade_unidadeId_competencia_idx" ON "public"."AjusteUnidade"("unidadeId", "competencia");

-- CreateIndex
CREATE INDEX "RateioItem_predioId_competencia_unidadeId_idx" ON "public"."RateioItem"("predioId", "competencia", "unidadeId");

-- CreateIndex
CREATE INDEX "RateioItem_unidadeId_competencia_idx" ON "public"."RateioItem"("unidadeId", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "RateioItem_unidadeId_competencia_origemTipo_origemId_key" ON "public"."RateioItem"("unidadeId", "competencia", "origemTipo", "origemId");

-- CreateIndex
CREATE INDEX "Pagamento_unidadeId_competencia_idx" ON "public"."Pagamento"("unidadeId", "competencia");

-- CreateIndex
CREATE INDEX "Pagamento_status_dataVencimento_idx" ON "public"."Pagamento"("status", "dataVencimento");

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

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_despesa_comp_ux" ON "public"."Pagamento"("despesaFixaId", "competencia");

-- CreateIndex
CREATE INDEX "Responsavel_unidadeId_ativo_idx" ON "public"."Responsavel"("unidadeId", "ativo");

-- CreateIndex
CREATE INDEX "Responsavel_unidadeId_ehTitularCobranca_ativo_idx" ON "public"."Responsavel"("unidadeId", "ehTitularCobranca", "ativo");

-- CreateIndex
CREATE INDEX "Unidade_predioId_ativo_idx" ON "public"."Unidade"("predioId", "ativo");

-- CreateIndex
CREATE INDEX "Unidade_predioId_numeroInt_idx" ON "public"."Unidade"("predioId", "numeroInt");

-- AddForeignKey
ALTER TABLE "public"."Pagamento" ADD CONSTRAINT "Pagamento_predioId_fkey" FOREIGN KEY ("predioId") REFERENCES "public"."Predio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Pagamento" ADD CONSTRAINT "Pagamento_despesaFixaId_fkey" FOREIGN KEY ("despesaFixaId") REFERENCES "public"."DespesaFixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DespesaFixa" ADD CONSTRAINT "DespesaFixa_predioId_fkey" FOREIGN KEY ("predioId") REFERENCES "public"."Predio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DespesaFixaValorPorUnidade" ADD CONSTRAINT "DespesaFixaValorPorUnidade_despesaId_fkey" FOREIGN KEY ("despesaId") REFERENCES "public"."DespesaFixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DespesaFixaValorPorUnidade" ADD CONSTRAINT "DespesaFixaValorPorUnidade_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "public"."Unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DespesaVariavel" ADD CONSTRAINT "DespesaVariavel_predioId_fkey" FOREIGN KEY ("predioId") REFERENCES "public"."Predio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AjusteUnidade" ADD CONSTRAINT "AjusteUnidade_predioId_fkey" FOREIGN KEY ("predioId") REFERENCES "public"."Predio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AjusteUnidade" ADD CONSTRAINT "AjusteUnidade_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "public"."Unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RateioItem" ADD CONSTRAINT "RateioItem_predioId_fkey" FOREIGN KEY ("predioId") REFERENCES "public"."Predio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RateioItem" ADD CONSTRAINT "RateioItem_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "public"."Unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
