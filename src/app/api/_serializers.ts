// src/app/api/_serializers.ts
// Helper puro e explícito para serialização monetária no boundary.
// Mantém o comportamento: apenas converte para number sem arredondar.

/* eslint-disable @typescript-eslint/no-explicit-any */
export function decimalToNumber(value: any): number {
  if (typeof value === 'number') return value
  // Prisma.Decimal e outros tipos numéricos costumam ter toString/ valueOf
  // Conversão direta preserva semântica atual usada nas rotas.
  return Number(value as any)
}

