import type { ICadCategoriaProduto, IManutCategoriaProduto } from '@/interface/pages/CategoriaProduto'
import { apiRequest } from '@/services/api.service'

export function getProductCategoryList() {
  return apiRequest<ICadCategoriaProduto[]>('/categoriasProduto/view')
}

export function saveProductCategory(values: IManutCategoriaProduto) {
  return apiRequest<ICadCategoriaProduto>(
    '/categoriasProduto/manut',
    values,
  )
}
