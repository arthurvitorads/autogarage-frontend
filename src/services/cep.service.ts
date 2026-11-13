import type { IEnderecoViaCep } from '@/interface/util'
import { apiRequest } from '@/services/api.service'

export async function fetchCep(cep: string) {
  const { dados } = await apiRequest<IEnderecoViaCep>('/pessoa/consultar-cep', { cep })
  return dados
}
