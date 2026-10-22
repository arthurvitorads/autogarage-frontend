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
