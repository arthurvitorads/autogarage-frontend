export type TipoPessoa = 'PF' | 'PJ'
export interface Endereco {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}
interface PessoaBase {
  id?: string | number
  bo_categ_cliente: boolean
  bo_categ_func: boolean
  email: string
  telefone: string
  bo_sts_reg: boolean
  endereco: Endereco
  cargo?: string
  comissaoPercentual?: number
}
export interface PessoaFisica extends PessoaBase {
  tipo: 'PF'
  nome: string
  cpf: string
}
export interface PessoaJuridica extends PessoaBase {
  tipo: 'PJ'
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
}
// Contrato provisório do frontend, a alinhar com a futura API.
export type Pessoa = PessoaFisica | PessoaJuridica
