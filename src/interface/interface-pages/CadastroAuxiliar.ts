export type TTipoCadastroAuxiliar = 'CATEGORIA_PRODUTO' | 'CATEGORIA_SERVICO' | 'MARCA' | 'UNIDADE'

export interface IFormCadastroAuxiliar {
  an_descr: string
  ca_sigla: string
}

export interface IManutCadastroAuxiliar extends IFormCadastroAuxiliar {
  ca_tipo: TTipoCadastroAuxiliar
}

export interface IAdmCadastroAuxiliar extends IManutCadastroAuxiliar {
  cn_cadastro: number
}
