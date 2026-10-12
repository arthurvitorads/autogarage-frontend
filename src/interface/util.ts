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
