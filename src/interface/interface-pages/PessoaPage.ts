export interface ICadPessoa {
  cnPessoa: number
  caTipo: 'PF' | 'PJ'
  anNome?: string
  caCpf?: string
  caCnpj?: string
  anRazaoSocial?: string
  anNomeFantasia?: string
  anEmail?: string
  anTelefone?: string
  boCategCliente: boolean
  boCategFunc: boolean
  anCargo?: string
  nmComissaoPercentual?: number
  boStsReg: boolean
  dtInc: string
  dtAlt: string
}

export interface ICadEndereco {
  cnEndereco: number
  cnPessoa: number
  caCep?: string
  anLogradouro?: string
  anNumero?: string
  anComplemento?: string
  anBairro?: string
  anCidade?: string
  caUf?: string
  boStsReg: boolean
  dtInc: string
  dtAlt: string
}

export interface IPessoaResponse {
  sucesso: boolean
  dados: {
    pessoa: ICadPessoa[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  }
}
