export interface IFormCategoriaServico {
  an_descr: string
}

export interface IManutCategoriaServico extends IFormCategoriaServico {
  cn_categoria_servico?: number
}

export interface ICadCategoriaServico extends IFormCategoriaServico {
  cn_categoria_servico: number
  dt_inc: string
  dt_alt: string
}
