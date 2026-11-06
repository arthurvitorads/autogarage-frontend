import type { IFormProduct } from '@/interface/interface-pages/ProdutoPage'

export class ProductModel {
  static createForm(): IFormProduct {
    return {
      an_nome: '',
      an_referencia: '',
      an_categoria: null,
      an_marca: null,
      ca_unidade: '',
      vl_custo: 0,
      vl_venda: 0,
      qt_estoque: 0,
      qt_estoque_min: 0,
      an_obs: '',
      bo_sts_reg: true,
    }
  }
}
