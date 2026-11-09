import { apiList, apiPage, apiRequest } from '@/services/api.service'
import type {
  IAdmVenda,
  IManutSale,
  ITimeReportResponse,
  ISaleReportResponse,
  TBillableOrder,
  TSaleCustomer,
} from '@/interface/interface-pages/VendaPage'

export function getBillableOrders() {
  return apiList<TBillableOrder>('/faturamento/ordens/listar', 'ordens')
}

export function getSaleCustomer(id: string | number, orderId?: string | number) {
  return apiRequest<TSaleCustomer>('/faturamento/cliente', {
    cn_pessoa: id,
    cn_ordem_servico: orderId,
  })
}

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
