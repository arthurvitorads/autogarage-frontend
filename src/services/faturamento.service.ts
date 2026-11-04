import { apiPage, apiRequest } from '@/services/api.service'
import type { IAdmVenda, IManutVenda, IRelatorioTempoResponse, IRelatorioVendaResponse } from '@/interface/interface-pages/VendaPage'

export function getVendasPagina(page: number, limit: number, search: string) {
  return apiPage<IAdmVenda>('/faturamento/vendas', 'vendas', page, limit, search)
}

export function getVenda(codigo: string) {
  return apiRequest<IAdmVenda>('/faturamento/vendas/' + encodeURIComponent(codigo))
}

export function createVenda(values: IManutVenda) {
  return apiRequest<IAdmVenda>('/faturamento/vendas', values)
}

export function getRelatorioTempos(page: number, inicio: string, fim: string, ordem: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20', inicio, fim, ordem })
  return apiRequest<IRelatorioTempoResponse>('/relatorios/tempos-servicos?' + params)
}

export function getRelatorioVendas(page: number, inicio: string, fim: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20', inicio, fim })
  return apiRequest<IRelatorioVendaResponse>('/relatorios/vendas?' + params)
}
