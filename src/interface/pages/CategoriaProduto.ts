export interface IFormCategoriaProduto {
  an_descr: string
}

export interface IManutCategoriaProduto extends IFormCategoriaProduto {
  cn_categoria_produto?: number
}

export interface ICadCategoriaProduto extends IFormCategoriaProduto {
  cn_categoria_produto: number
  dt_inc: string
  dt_alt: string
}
