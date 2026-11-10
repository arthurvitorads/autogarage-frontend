import type { ITipoPessoa } from '@/interface/enum'

export type TServiceOrderStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO'
export type TServiceOrderAction = 'INICIAR' | 'FINALIZAR' | 'CANCELAR'

export type TServiceOrderCode = string | number

export interface IClienteOrdemServico {
  cn_pessoa: string | number
  an_nome: string
  an_documento: string
  tipo: ITipoPessoa
}

export interface IFormOrderClassification {
  an_descr: string
  ca_cor: string
  bo_padrao: boolean
}

export interface IManutOrderClassification extends IFormOrderClassification {
  cn_classificacao?: TServiceOrderCode
}

export interface IClassificacaoOrdemServico extends IManutOrderClassification {
  cn_classificacao: TServiceOrderCode
}

export interface IServiceOrderVehicle {
  an_placa: string
  an_marca: string
  an_modelo: string
  nu_ano: number | null
  an_cor: string
  qt_quilometragem: number | null
}

export interface IFormServiceOrder extends IServiceOrderVehicle {
  cn_pessoa: string | number | null
  cn_classificacao: TServiceOrderCode | null
  dt_entrada: string
  dt_previsao: string
  an_responsavel: string
  an_solicitacao: string
  an_obs: string
}

// Contratos de manutenção e resposta da API de ordens.
export interface IManutServiceOrder {
  cn_ordem_servico?: TServiceOrderCode
  cn_pessoa: string | number
  cn_classificacao: TServiceOrderCode
  dt_entrada: string
  dt_previsao: string | null
  an_responsavel: string
  veiculo: IServiceOrderVehicle
  an_solicitacao: string
  an_obs: string
}

export type TServiceOrderItemType = 'PRODUTO' | 'SERVICO'

export interface IFormServiceOrderItem {
  ca_tipo: TServiceOrderItemType
  cn_referencia: TServiceOrderCode | null
  qt_quantidade: number | null
  vl_unitario: number | null
}

interface IManutServiceOrderItemBase {
  cn_ordem_servico: TServiceOrderCode
  cn_item?: TServiceOrderCode
  qt_quantidade: number
  vl_unitario: number
}

export type TManutServiceOrderItem = IManutServiceOrderItemBase &
  (
    | {
        ca_tipo: 'PRODUTO'
        cn_produto: TServiceOrderCode
      }
    | {
        ca_tipo: 'SERVICO'
        cn_servico: TServiceOrderCode
      }
  )

export type TItemOrdemServico = TManutServiceOrderItem & {
  ca_status_servico: 'PENDENTE' | 'EM_ANDAMENTO' | 'PAUSADO' | 'FINALIZADO' | 'CANCELADO'
  qt_tempo_segundos: number
  dt_inicio_tempo: string | null
  dt_servidor: string
  cn_item: TServiceOrderCode
  an_descr: string
  ca_unidade: string
  vl_total: number
}

export interface IAdmOrdemServico extends IManutServiceOrder {
  cn_venda: string | null
  ca_status: TServiceOrderStatus
  an_motivo_cancelamento: string
  dt_inicio: string | null
  dt_finalizacao: string | null
  dt_cancelamento: string | null
  cn_ordem_servico: TServiceOrderCode
  nu_numero: number
  an_cliente: string
  itens: TItemOrdemServico[]
}
