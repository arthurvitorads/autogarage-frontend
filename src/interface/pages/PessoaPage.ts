import { IDialogProps } from '../dialog'

import type { ICadPessoa } from '@/interface/tables'

import type { ITipoPessoa } from '@/interface/enum'

// Manut

export interface IManutEndereco {
  ca_cep: string
  an_logradouro: string
  an_numero: string
  an_complemento: string
  an_bairro: string
  an_cidade: string
  cn_estado: string
}

export interface IManutPessoa {
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
  endereco: IManutEndereco
}

export interface IFormPessoa
  extends Omit<
    IManutPessoa,
    | 'endereco'
    | 'an_nome'
    | 'ca_cpf'
    | 'ca_cnpj'
    | 'an_razao_social'
    | 'an_nome_fantasia'
    | 'nm_comissao_func'
  >, IManutEndereco {
  an_nome: string
  ca_cpf: string
  ca_cnpj: string
  an_razao_social: string
  an_nome_fantasia: string
  nm_comissao_func: number | null
}

export interface IManutPessoaDialogProps extends IDialogProps {
  person?: ICadPessoa | null
  people?: ICadPessoa[]
}

// Generic types

export type TPersonCategory = 'bo_categ_cliente' | 'bo_categ_func'

export const personCategories: { label: string; value: TPersonCategory }[] = [
  { label: 'Cliente', value: 'bo_categ_cliente' },
  { label: 'Funcionário', value: 'bo_categ_func' },
]