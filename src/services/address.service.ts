import { apiRequest } from '@/services/api.service'

export interface IEndEstado {
  cn_estado: string
  an_descr: string
  ca_uf: string
  ca_pais: string
  dt_inc: string
  dt_alt: string
}

export async function getStates() {
  const { dados } = await apiRequest<IEndEstado[]>('/end/estados')
  return dados
}
