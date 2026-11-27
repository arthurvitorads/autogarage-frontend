import type { TItemOrdemServico } from '@/interface/tables'
import type { IClassificacaoOrdemServico, IAdmOrdemServico } from '@/interface/tables'
import { apiPage, apiRequest } from '@/services/api.service'
import type { TSaleCustomer } from '@/interface/pages/VendaPage'
import type {
  IClienteOrdemServico,
  IManutOrdemServico,
  IManutClassificacaoOrdemServico,
  TManutItemOrdemServico,
  TServiceOrderCode,
  TServiceOrderAction,
  IServiceOrderEmployee,
  IServiceOrderEvidence,
  IServiceOrderEvidenceInput,
  IServiceOrderVehicle,
  IMarcaVeiculo,
} from '@/interface/pages/OrdemServicoPage'

export function getOrder(id: TServiceOrderCode) {
  return apiRequest<IAdmOrdemServico>('/ordensServico/detalhar', { cn_ordem: id })
}

export function getClassifications() {
  return apiRequest<IClassificacaoOrdemServico[]>('/classificacoesOrdens/view')
}

export function getCustomers() {
  return apiRequest<IClienteOrdemServico[]>('/pessoa/param')
}

export function getOrderCustomer(id: TServiceOrderCode) {
  return apiRequest<TSaleCustomer>('/ordensServico/cliente', { cn_pessoa: id })
}

export function getOrderEmployees() {
  return apiRequest<IServiceOrderEmployee[]>('/ordensServico/funcionarios/param')
}

export function getVehicleCatalog() {
  return apiRequest<IMarcaVeiculo[]>('/ordensServico/veiculos/param')
}

export function gravarMarcaVeiculo(dados: { cn_marca_veiculo?: number; an_descr: string }) {
  return apiRequest<{ cn_marca_veiculo: number }>('/marcasVeiculos/manut', dados)
}

export function gravarModeloVeiculo(dados: {
  cn_modelo_veiculo?: number
  cn_marca_veiculo: number
  an_descr: string
}) {
  return apiRequest<{ cn_modelo_veiculo: number }>('/modelosVeiculos/manut', dados)
}

export function lookupOrderPlate(plate: string) {
  return apiRequest<Pick<
    IServiceOrderVehicle,
    'an_marca' | 'an_modelo' | 'nu_ano' | 'an_cor'
  > | null>('/ordensServico/consultar-placa', { an_placa: plate })
}

export function getOrderEvidences(id: TServiceOrderCode) {
  return apiRequest<IServiceOrderEvidence[]>('/ordensServico/evidencias/view', {
    cn_ordem: id,
  })
}

export function anexarEvidencia(cn_ordem: TServiceOrderCode, imagem: IServiceOrderEvidenceInput) {
  return apiRequest<IServiceOrderEvidence>('/ordensServico/evidencias/manut', {
    cn_ordem,
    ...imagem,
  })
}

export function gravarDescricaoEvidencia(
  cn_ordem: TServiceOrderCode,
  cn_evidencia: string,
  an_descr: string,
) {
  return apiRequest<{ an_descr: string }>('/ordensServico/evidencias/manut', {
    cn_ordem,
    cn_evidencia,
    an_descr,
  })
}

export function saveOrder(values: IManutOrdemServico) {
  return apiRequest<IAdmOrdemServico>('/ordensServico/manut', values)
}

export function saveClassification(values: IManutClassificacaoOrdemServico) {
  return apiRequest<IClassificacaoOrdemServico>('/classificacoesOrdens/manut', values)
}

export function saveItem(values: TManutItemOrdemServico) {
  return apiRequest<TItemOrdemServico>('/ordensServico/itens/manut', values)
}

export function removeItem(orderId: TServiceOrderCode, itemId: TServiceOrderCode) {
  return apiRequest<{ cn_item: string }>('/ordensServico/itens/manut/remover', {
    cn_ordem: orderId,
    cn_item: itemId,
  })
}

export function updateItemTime(
  orderId: TServiceOrderCode,
  itemId: TServiceOrderCode,
  action: 'INICIAR' | 'PAUSAR' | 'FINALIZAR',
) {
  return apiRequest<TItemOrdemServico>('/ordensServico/itens/manut/tempo', {
    cn_ordem: orderId,
    cn_item: itemId,
    acao: action,
  })
}

export function getOrdersPage(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string | string[]> = {},
) {
  return apiPage<IAdmOrdemServico>('/ordensServico/view', page, limit, search, filters)
}

export function moveOrder(orderId: TServiceOrderCode, action: TServiceOrderAction, reason: string) {
  return apiRequest<IAdmOrdemServico>('/ordensServico/manut/movimentar', {
    cn_ordem: orderId,
    acao: action,
    an_motivo_cancelamento: reason,
  })
}
