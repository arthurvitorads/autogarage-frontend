import type { ICnpjBrasilApiResponse } from '@/interface/util'
import { apiRequest } from '@/services/api.service'

export async function fetchCnpj(cnpj: string) {
  const { dados } = await apiRequest<ICnpjBrasilApiResponse | null>('/pessoa/consultar-cnpj', {
    cnpj,
  })
  return dados
}
