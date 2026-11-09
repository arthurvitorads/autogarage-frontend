export type TAuxiliaryType = 'CATEGORIA_PRODUTO' | 'CATEGORIA_SERVICO' | 'MARCA' | 'UNIDADE'

export interface IFormDescription {
  an_descr: string
}

export interface IFormAuxiliary extends IFormDescription {
  ca_sigla: string
}

export interface IManutAuxiliary extends IFormAuxiliary {
  cn_cadastro?: number
  ca_tipo: TAuxiliaryType
}

export interface IAdmCadastroAuxiliar extends IManutAuxiliary {
  cn_cadastro: number
}
