export interface TGenericData {
  [campo: string]: string
}

export interface IConsultaCep {
  ca_cep: string
  an_logradouro: string
  an_complemento: string
  an_bairro: string
  an_cidade: string
  ca_uf: string
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
export interface IConsultaCnpj extends IConsultaCep {
  ca_cnpj: string
  an_razao_social: string
  an_nome_fantasia: string
  an_email: string
  an_telefone: string | null
  an_numero: string
}
export interface IFormPageRef {
  submit: () => void
}

export interface IGridActionEvent<TData> {
  action: string
  data?: TData
}
