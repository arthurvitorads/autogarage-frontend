import type { ICadMarca, IManutMarca } from '@/interface/pages/Marca'
import { apiRequest } from '@/services/api.service'

export function getBrandList() {
  return apiRequest<ICadMarca[]>('/marcas/listar')
}

export function saveBrand(values: IManutMarca) {
  return apiRequest<ICadMarca>(
    values.cn_marca === undefined ? '/marcas' : '/marcas/atualizar',
    values,
  )
}
