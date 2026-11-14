import type { ICadPessoa } from '@/interface/tables'
import { IDialogProps } from '../dialog'

import { Pessoa } from '@/models/pessoa.model'

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

// Manut

export interface IManutPersonDialogProps extends IDialogProps {
  person?: Pessoa | null
  people?: Pessoa[]
}
