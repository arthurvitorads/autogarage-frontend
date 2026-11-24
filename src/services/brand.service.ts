import type { ICadMarca, IManutMarca } from '@/interface/pages/Marca'
import { apiRequest } from '@/services/api.service'

export function getBrandList() {
  return apiRequest<ICadMarca[]>('/marcas/view')
}

export function saveBrand(values: IManutMarca) {
  return apiRequest<ICadMarca>(
    '/marcas/manut',
    values,
  )
}
