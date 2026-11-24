import type { IAdmProduto } from '@/interface/tables'
import type { IManutProduto } from '@/interface/pages/ProdutoPage'
import { apiPage, apiRequest } from '@/services/api.service'

export function saveProduct(values: IManutProduto) {
  return apiRequest<IAdmProduto>(
    '/produtos/manut',
    values,
  )
}

export function getProductsPage(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string> = {},
) {
  return apiPage<IAdmProduto>('/produtos/view', page, limit, search, filters)
}
