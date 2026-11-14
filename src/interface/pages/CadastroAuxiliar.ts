export type TAuxiliaryType = 'CATEGORIA_PRODUTO' | 'CATEGORIA_SERVICO' | 'MARCA' | 'UNIDADE'

export interface IFormDescricao {
  an_descr: string
}

export interface IFormAuxiliar extends IFormDescricao {
  ca_sigla: string
}

export interface IManutAuxiliar extends IFormAuxiliar {
  cn_cadastro?: number
  ca_tipo: TAuxiliaryType
}
