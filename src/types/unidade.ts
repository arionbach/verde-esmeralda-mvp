export type UnidadeTipo = 'apartamento' | 'cobertura' | 'loja' | 'garagem';
export type UnidadeStatus = 'ocupado' | 'vazio';

/** O que a UI consome (DTO já normalizado pelo backend) */
export interface UnidadeDTO {
  id: string;
  predioId: string;
  numero: string;
  tipo: UnidadeTipo;
  metragem: number | null;
  fracaoIdeal: number | null;
  valorTaxa: number;           // número já pronto p/ toFixed/Intl
  status: UnidadeStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** Payloads para API */
export interface UnidadeCreateInput {
  numero: string;
  tipo: UnidadeTipo;
  metragem?: number | null;
  fracaoIdeal?: number | null;
  valorTaxa: number;
  status: UnidadeStatus;
}
export type UnidadeUpdateInput = Partial<UnidadeCreateInput>;
