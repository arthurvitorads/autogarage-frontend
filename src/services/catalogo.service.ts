import { apiRequest } from '@/services/api.service'

export interface ICatalogItemOption {
  cn_produto?: number
  cn_servico?: number
  an_nome: string
  ca_unidade: string
  vl_preco: number
}

export function getCatalogItemOptions() {
  return apiRequest<{ produtos: ICatalogItemOption[]; servicos: ICatalogItemOption[] }>(
    '/catalogo/param',
  )
}
