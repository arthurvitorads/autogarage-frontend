import { apiList, apiRequest } from '@/services/api.service'
import type {
  IAdmOrdemServico, IClienteOrdemServico, IManutOrdemServico, IManutStatusOrdemServico,
  IStatusOrdemServico, TItemOrdemServico, TManutItemOrdemServico, TCodigoOrdemServico
} from '@/interface/interface-pages/OrdemServicoPage'

export function getOrdens() {
  return apiList<IAdmOrdemServico>('/ordensServico', 'ordens')
}

export function getStatus() {
  return apiRequest<{
    status: IStatusOrdemServico[]
  }>('/statusOrdens')
}

export function getClientes() {
  return apiRequest<{
    clientes: IClienteOrdemServico[]
  }>('/paramPessoa')
}

export function saveOrdem(values: IManutOrdemServico) {
  return apiRequest<IAdmOrdemServico>(`/ordensServico${values.cn_ordem_servico === undefined ? '' : '/' + encodeURIComponent(values.cn_ordem_servico)}`, values)
}

export function saveStatus(values: IManutStatusOrdemServico) {
  return apiRequest<IStatusOrdemServico>(`/statusOrdens${values.cn_status === undefined ? '' : '/' + encodeURIComponent(values.cn_status)}`, values)
}

export function saveItem(values: TManutItemOrdemServico) {
  return apiRequest<TItemOrdemServico>(`/ordensServico/${encodeURIComponent(values.cn_ordem_servico)}/itens${values.cn_item === undefined ? '' : '/' + encodeURIComponent(values.cn_item)}`, values)
}

export function removeItem(ordem: TCodigoOrdemServico, item: TCodigoOrdemServico) {
  return apiRequest(`/ordensServico/${encodeURIComponent(ordem)}/itens/${encodeURIComponent(item)}/remover`, {})
}
