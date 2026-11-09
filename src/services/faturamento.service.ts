import { apiPage, apiRequest } from '@/services/api.service'
import type {
  IAdmVenda,
  IManutSale,
  ITimeReportResponse,
  ISaleReportResponse,
} from '@/interface/interface-pages/VendaPage'

export function getVendasPagina(page: number, limit: number, search: string) {
  return apiPage<IAdmVenda>('/faturamento/vendas/listar', 'vendas', page, limit, search)
}

export function getVenda(codigo: string) {
  return apiRequest<IAdmVenda>('/faturamento/vendas/detalhar', { cn_venda: codigo })
}

export function createVenda(values: IManutSale) {
  return apiRequest<IAdmVenda>('/faturamento/vendas', values)
}

export function getRelatorioTempos(page: number, inicio: string, fim: string, ordem: string) {
  return apiRequest<ITimeReportResponse>('/relatorios/tempos-servicos', {
    page,
    limit: 20,
    inicio,
    fim,
    ordem,
  })
}

export function getRelatorioVendas(page: number, inicio: string, fim: string) {
  return apiRequest<ISaleReportResponse>('/relatorios/vendas', { page, limit: 20, inicio, fim })
}
