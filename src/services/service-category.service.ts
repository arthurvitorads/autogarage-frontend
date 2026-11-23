import type { ICadCategoriaServico, IManutCategoriaServico } from '@/interface/pages/CategoriaServico'
import { apiRequest } from '@/services/api.service'

export function getServiceCategoryList() {
  return apiRequest<ICadCategoriaServico[]>('/categoriasServico/listar')
}

export function saveServiceCategory(values: IManutCategoriaServico) {
  return apiRequest<ICadCategoriaServico>(
    values.cn_categoria_servico === undefined ? '/categoriasServico' : '/categoriasServico/atualizar',
    values,
  )
}
