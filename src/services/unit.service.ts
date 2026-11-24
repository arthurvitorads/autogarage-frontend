import type { ICadUnidade, IManutUnidade } from '@/interface/pages/Unidade'
import { apiRequest } from '@/services/api.service'

export function getUnitList() {
  return apiRequest<ICadUnidade[]>('/unidades/view')
}

export function saveUnit(values: IManutUnidade) {
  return apiRequest<ICadUnidade>('/unidades/manut', values)
}
