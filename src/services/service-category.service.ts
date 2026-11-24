import type {
  ICadCategoriaServico,
  IManutCategoriaServico,
} from '@/interface/pages/CategoriaServico'
import { apiRequest } from '@/services/api.service'

export function getServiceCategoryList() {
  return apiRequest<ICadCategoriaServico[]>('/categoriasServico/view')
}

export function saveServiceCategory(values: IManutCategoriaServico) {
  return apiRequest<ICadCategoriaServico>('/categoriasServico/manut', values)
}
