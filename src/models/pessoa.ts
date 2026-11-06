export type TPersonType = 'PF' | 'PJ'
export interface IAddress {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

interface IPersonBase {
  id?: string | number
  bo_categ_cliente: boolean
  bo_categ_func: boolean
  email: string
  telefone: string
  bo_sts_reg: boolean
  endereco: IAddress
  cargo?: string
  comissaoPercentual?: number
}

export interface IIndividualPerson extends IPersonBase {
  tipo: 'PF'
  nome: string
  cpf: string
}

export interface ILegalPerson extends IPersonBase {
  tipo: 'PJ'
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
}

// Modelo do formulário; o serviço converte para os campos da API.
export type Person = IIndividualPerson | ILegalPerson
