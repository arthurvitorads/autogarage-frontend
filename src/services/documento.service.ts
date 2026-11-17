import type { IConsultaCnpj } from '@/interface/util'
import { apiRequest } from '@/services/api.service'

export async function fetchCnpj(cnpj: string) {
  const { dados } = await apiRequest<IConsultaCnpj | null>('/pessoa/consultar-cnpj', {
    ca_cnpj: cnpj,
  })
  return dados
}
