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
} from '@/interface/interface-pages/OrdemServicoPage'

export function getOrder(id: TServiceOrderCode) {
  return apiRequest<IAdmOrdemServico>('/ordensServico/detalhar', { cn_ordem_servico: id })
}

export function getClassificacoes() {
  return apiRequest<{
    classificacoes: IClassificacaoOrdemServico[]
  }>('/classificacoesOrdens/listar')
}

export function getClientes() {
  return apiRequest<{
    clientes: IClienteOrdemServico[]
  }>('/paramPessoa')
}

export function saveOrdem(values: IManutServiceOrder) {
  return apiRequest<IAdmOrdemServico>(
    values.cn_ordem_servico === undefined ? '/ordensServico' : '/ordensServico/atualizar',
    values,
  )
}

export function saveClassificacao(values: IManutOrderClassification) {
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

export function removeItem(ordem: TServiceOrderCode, item: TServiceOrderCode) {
  return apiRequest('/ordensServico/itens/remover', { cn_ordem_servico: ordem, cn_item: item })
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

export function getOrdensPagina(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string> = {},
) {
  return apiPage<IAdmOrdemServico>('/ordensServico/listar', 'ordens', page, limit, search, filters)
}

export function movimentarOrdem(
  codigo: TServiceOrderCode,
  acao: import('@/interface/interface-pages/OrdemServicoPage').TServiceOrderAction,
  motivo: string,
) {
  return apiRequest<IAdmOrdemServico>('/ordensServico/movimentar', {
    cn_ordem_servico: codigo,
    acao,
    an_motivo_cancelamento: motivo,
  })
}
