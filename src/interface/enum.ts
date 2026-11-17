// Tipo de pessoa

export enum TipoPessoa {
  PF = 'PF',
  PJ = 'PJ',
}

export type ITipoPessoa = `${TipoPessoa}`

export const personTypes = [
  { label: 'Física', value: TipoPessoa.PF },
  { label: 'Jurídica', value: TipoPessoa.PJ },
]
