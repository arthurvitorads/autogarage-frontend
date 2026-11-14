import type { IEndEstado } from '@/interface/tables'
import { apiRequest } from '@/services/api.service'

export async function getStates() {
  const { dados } = await apiRequest<IEndEstado[]>('/end/estados')
  return dados
}
