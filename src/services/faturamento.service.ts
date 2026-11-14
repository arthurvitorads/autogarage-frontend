import type { IAdmVenda } from '@/interface/tables'
import { apiList, apiPage, apiRequest } from '@/services/api.service'
import type { IManutSale, TBillableOrder, TSaleCustomer } from '@/interface/pages/VendaPage'

export function getBillableOrders() {
  return apiList<TBillableOrder>('/faturamento/ordens/listar')
}

export function getSaleCustomer(id: string | number, orderId?: string | number) {
  return apiRequest<TSaleCustomer>('/faturamento/cliente', {
    cn_pessoa: id,
    cn_ordem_servico: orderId,
  })
}

export function getSalesPage(page: number, limit: number, search: string) {
  return apiPage<IAdmVenda>('/faturamento/vendas/listar', page, limit, search)
}

export function getSale(id: string) {
  return apiRequest<IAdmVenda>('/faturamento/vendas/detalhar', { cn_venda: id })
}

export function createSale(values: IManutSale) {
  return apiRequest<IAdmVenda>('/faturamento/vendas', values)
}
