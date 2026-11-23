import type { ICadUnidade, IManutUnidade } from '@/interface/pages/Unidade'
import { apiRequest } from '@/services/api.service'

export function getUnitList() {
  return apiRequest<ICadUnidade[]>('/unidades/listar')
}

export function saveUnit(values: IManutUnidade) {
  return apiRequest<ICadUnidade>(
    values.cn_unidade === undefined ? '/unidades' : '/unidades/atualizar',
    values,
  )
}
