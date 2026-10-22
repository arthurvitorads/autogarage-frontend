export interface TGenericData {
  [campo: string]: string
}

export interface IEnderecoViaCep {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
}

export interface IViaCepResponse extends IEnderecoViaCep {
  erro?: boolean
}

export type DomainValue = string | number | null

export interface DomainOption {
  id: string | number
  an_descr: string
}

export interface IDomainFieldProps {
  endpoint: string
  optionsPath?: string
  params?: Record<string, string | number | boolean>
  name?: string
  inputId?: string
  label?: string
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  invalid?: boolean
  filter?: boolean
  showClear?: boolean
  hideWhenEmpty?: boolean
}
  export interface ICnpjBrasilApiResponse {
  cnpj: string
  razao_social: string
  nome_fantasia?: string | null
  email?: string | null
  ddd_telefone_1?: string | null
  ddd_telefone_2?: string | null
  cep?: string | null
  descricao_tipo_de_logradouro?: string | null
  logradouro?: string | null
  numero?: string | null
  complemento?: string | null
  bairro?: string | null
  municipio?: string | null
  uf?: string | null
}
