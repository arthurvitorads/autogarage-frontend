import { apiList, apiPage, apiRequest } from '@/services/api.service'
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

export function getOrdens() {
  return apiList<IAdmOrdemServico>('/ordensServico', 'ordens')
}

export function getClassificacoes() {
  return apiRequest<{
    classificacoes: IClassificacaoOrdemServico[]
  }>('/classificacoesOrdens')
}

export function getClientes() {
  return apiRequest<{
    clientes: IClienteOrdemServico[]
  }>('/paramPessoa')
}

export function saveOrdem(values: IManutServiceOrder) {
  return apiRequest<IAdmOrdemServico>(
    `/ordensServico${values.cn_ordem_servico === undefined ? '' : '/' + encodeURIComponent(values.cn_ordem_servico)}`,
    values,
  )
}

export function saveClassificacao(values: IManutOrderClassification) {
  return apiRequest<IClassificacaoOrdemServico>(
    `/classificacoesOrdens${values.cn_classificacao === undefined ? '' : '/' + encodeURIComponent(values.cn_classificacao)}`,
    values,
  )
}

export function saveItem(values: TManutServiceOrderItem) {
  return apiRequest<TItemOrdemServico>(
    `/ordensServico/${encodeURIComponent(values.cn_ordem_servico)}/itens${values.cn_item === undefined ? '' : '/' + encodeURIComponent(values.cn_item)}`,
    values,
  )
}

export function removeItem(ordem: TServiceOrderCode, item: TServiceOrderCode) {
  return apiRequest(
    `/ordensServico/${encodeURIComponent(ordem)}/itens/${encodeURIComponent(item)}/remover`,
    {},
  )
}

export function getOrdensPagina(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string> = {},
) {
  return apiPage<IAdmOrdemServico>('/ordensServico', 'ordens', page, limit, search, filters)
}

export function movimentarOrdem(
  codigo: TServiceOrderCode,
  acao: import('@/interface/interface-pages/OrdemServicoPage').TServiceOrderAction,
  motivo: string,
) {
  return apiRequest<IAdmOrdemServico>(
    '/ordensServico/' + encodeURIComponent(codigo) + '/movimentar',
    { acao, an_motivo_cancelamento: motivo },
  )
}
