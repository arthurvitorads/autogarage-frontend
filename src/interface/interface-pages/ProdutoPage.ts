export interface IFormProduto {
  an_nome: string
  an_referencia: string
  an_categoria: string | null
  an_marca: string | null
  ca_unidade: string
  vl_custo: number | null
  vl_venda: number | null
  qt_estoque: number | null
  qt_estoque_min: number | null
  an_obs: string
  bo_sts_reg: boolean
}

export interface IManutProduto extends Omit<IFormProduto,
  'vl_custo' | 'vl_venda' | 'qt_estoque' | 'qt_estoque_min' | 'an_categoria' | 'an_marca'> {
  cn_produto?: number
  an_categoria: string
  an_marca: string
  vl_custo: number
  vl_venda: number
  qt_estoque: number
  qt_estoque_min: number
}

export interface IAdmProduto extends IManutProduto {
  cn_produto: number
}

