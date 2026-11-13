import { apiPage, apiRequest } from '@/services/api.service'
import type {
  IAdmOrdemServico,
  IClienteOrdemServico,
  IManutServiceOrder,
  IManutOrderClassification,
  IClassificacaoOrdemServico,
  TItemOrdemServico,
  TManutServiceOrderItem,
  TServiceOrderCode,
  TServiceOrderAction,
} from '@/interface/pages/OrdemServicoPage'

export function getOrder(id: TServiceOrderCode) {
  return apiRequest<IAdmOrdemServico>('/ordensServico/detalhar', { cn_ordem_servico: id })
}

export function getClassifications() {
  return apiRequest<IClassificacaoOrdemServico[]>('/classificacoesOrdens/listar')
}

export function getCustomers() {
  return apiRequest<IClienteOrdemServico[]>('/paramPessoa')
}

export function saveOrder(values: IManutServiceOrder) {
  return apiRequest<IAdmOrdemServico>(
    values.cn_ordem_servico === undefined ? '/ordensServico' : '/ordensServico/atualizar',
    values,
  )
}

export function saveClassification(values: IManutOrderClassification) {
  return apiRequest<IClassificacaoOrdemServico>(
    values.cn_classificacao === undefined
      ? '/classificacoesOrdens'
      : '/classificacoesOrdens/atualizar',
    values,
  )
}

export function saveItem(values: TManutServiceOrderItem) {
  return apiRequest<TItemOrdemServico>(
    values.cn_item === undefined ? '/ordensServico/itens' : '/ordensServico/itens/atualizar',
    values,
  )
}

export function removeItem(orderId: TServiceOrderCode, itemId: TServiceOrderCode) {
  return apiRequest<{ cn_item: string }>('/ordensServico/itens/remover', {
    cn_ordem_servico: orderId,
    cn_item: itemId,
  })
}

export function updateItemTime(
  orderId: TServiceOrderCode,
  itemId: TServiceOrderCode,
  action: 'INICIAR' | 'PAUSAR' | 'FINALIZAR',
) {
  return apiRequest<TItemOrdemServico>('/ordensServico/itens/tempo', {
    cn_ordem_servico: orderId,
    cn_item: itemId,
    acao: action,
  })
}

export function getOrdersPage(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string> = {},
) {
  return apiPage<IAdmOrdemServico>('/ordensServico/listar', page, limit, search, filters)
}

export function moveOrder(orderId: TServiceOrderCode, action: TServiceOrderAction, reason: string) {
  return apiRequest<IAdmOrdemServico>('/ordensServico/movimentar', {
    cn_ordem_servico: orderId,
    acao: action,
    an_motivo_cancelamento: reason,
  })
}
