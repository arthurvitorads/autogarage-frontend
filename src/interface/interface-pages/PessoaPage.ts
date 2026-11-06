import type { TPersonType } from '@/models/pessoa'
import type { IPagination } from '@/services/api.service'

export interface IManutAddress {
  ca_cep: string
  an_logradouro: string
  an_numero: string
  an_complemento: string
  an_bairro: string
  an_cidade: string
  ca_uf: string
}

export interface ICadEndereco extends IManutAddress {
  cn_endereco: string
  cn_pessoa: string
  bo_sts_reg: boolean
  dt_inc: string
  dt_alt: string
}

export interface IManutPerson {
  ca_tipo: TPersonType
  an_nome: string | null
  ca_cpf: string | null
  ca_cnpj: string | null
  an_razao_social: string | null
  an_nome_fantasia: string | null
  an_email: string
  an_telefone: string
  bo_categ_cliente: boolean
  bo_categ_func: boolean
  an_cargo: string
  nm_comissao_percentual: number
  bo_sts_reg: boolean
  endereco: IManutAddress
}

export interface ICadPessoa extends Omit<IManutPerson, 'endereco'> {
  cn_pessoa: string
  dt_inc: string
  dt_alt: string
  endereco: ICadEndereco | null
}

export interface IFormPerson {
  tipo: TPersonType
  bo_categ_cliente: boolean
  bo_categ_func: boolean
  bo_sts_reg: boolean
  nome: string
  cpf: string
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  email: string
  telefone: string
  cargo: string
  comissaoPercentual: number | null
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export interface IPersonResponse {
  sucesso: boolean
  dados: {
    pessoa: ICadPessoa[]
    pagination: IPagination
  }
}
