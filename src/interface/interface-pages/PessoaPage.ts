import type { ITipoPessoa } from '@/interface/enum'

export interface IManutAddress {
  ca_cep: string
  an_logradouro: string
  an_numero: string
  an_complemento: string
  an_bairro: string
  an_cidade: string
  cn_estado: string
}

export interface ICadEndereco extends Omit<IManutAddress, 'cn_estado'> {
  cn_endereco: string
  cn_estado: string | null
  cn_pessoa: string
  bo_sts_reg: boolean
  dt_inc: string
  dt_alt: string
}

export interface IManutPerson {
  ca_tipo: ITipoPessoa
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
  nm_comissao_func: number
  bo_sts_reg: boolean
  endereco: IManutAddress
}

export interface ICadPessoa extends Omit<IManutPerson, 'endereco'> {
  cn_pessoa: string
  dt_inc: string
  dt_alt: string
  endereco: ICadEndereco | null
}

export interface IPessoaGridRow extends ICadPessoa {
  nome: string
  tipo: string
  documento: string
  telefone: string
  categorias: string
  status: string
  inclusao: string
  alteracao: string
}

export interface IFormPerson {
  tipo: ITipoPessoa
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
  nm_comissao_func: number | null
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  cn_estado: string
}
