import type { IConsultaCep } from '@/interface/util'
import { apiRequest } from '@/services/api.service'

export async function fetchCep(cep: string) {
  const { dados } = await apiRequest<IConsultaCep>('/pessoa/consultar-cep', { ca_cep: cep })
  return dados
}
