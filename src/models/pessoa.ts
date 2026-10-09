export type TipoPessoa =
  | 'PF'
  | 'PJ'

export type CategoriaPessoa =
  | 'CLIENTE'
  | 'FUNCIONARIO'

export interface Endereco {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
}

export interface Pessoa {
  id?: number

  tipo: TipoPessoa

  categorias: CategoriaPessoa[]

  nome: string
  email: string
  telefone: string

  endereco: Endereco
}

export interface PessoaFisica extends Pessoa {
  tipo: 'PF'

  cpf: string

  comissaoPercentual?: number
  cargo?: string
}

export interface PessoaJuridica extends Pessoa {
  tipo: 'PJ'

  cnpj: string

  razaoSocial: string
  nomeFantasia: string
}