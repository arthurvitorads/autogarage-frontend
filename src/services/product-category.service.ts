import type { ICadCategoriaProduto, IManutCategoriaProduto } from '@/interface/pages/CategoriaProduto'
import { apiRequest } from '@/services/api.service'

export function getProductCategoryList() {
  return apiRequest<ICadCategoriaProduto[]>('/categoriasProduto/listar')
}

export function saveProductCategory(values: IManutCategoriaProduto) {
  return apiRequest<ICadCategoriaProduto>(
    values.cn_categoria_produto === undefined ? '/categoriasProduto' : '/categoriasProduto/atualizar',
    values,
  )
}
