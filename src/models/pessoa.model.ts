export interface IEndereco {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  cn_estado: string
}

interface IPessoaBase {
  cn_pessoa?: string | number
  bo_categ_cliente: boolean
  bo_categ_func: boolean
  email: string
  telefone: string
  bo_sts_reg: boolean
  endereco: IEndereco
  cargo?: string
  nm_comissao_func?: number
}

export interface IFisica extends IPessoaBase {
  tipo: 'PF'
  nome: string
  cpf: string
}

export interface IJuridica extends IPessoaBase {
  tipo: 'PJ'
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
}

export type Pessoa = IFisica | IJuridica
