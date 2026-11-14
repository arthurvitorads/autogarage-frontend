import type { TItemOrdemServico } from '@/interface/tables'
import type { IAdmOrdemServico } from '@/interface/tables'
import type { IDialogProps } from '@/interface/dialog'
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

export interface IFormClassificacaoOrdemServico {
  an_descr: string
  ca_cor: string
  bo_padrao: boolean
}

export interface IManutClassificacaoOrdemServico extends IFormClassificacaoOrdemServico {
  cn_classificacao?: TServiceOrderCode
}

export interface IServiceOrderVehicle {
  an_placa: string
  an_marca: string
  an_modelo: string
  nu_ano: number | null
  an_cor: string
  qt_quilometragem: number | null
}

export interface IFormOrdemServico extends IServiceOrderVehicle {
  cn_pessoa: string | number | null
  cn_classificacao: TServiceOrderCode | null
  dt_entrada: string
  dt_previsao: string
  an_responsavel: string
  an_solicitacao: string
  an_obs: string
}

// Contratos de manutenção e resposta da API de ordens.
export interface IManutOrdemServico {
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

export interface IFormItemOrdemServico {
  ca_tipo: TServiceOrderItemType
  cn_referencia: TServiceOrderCode | null
  qt_quantidade: number | null
  vl_unitario: number | null
}

interface IManutItemOrdemServicoBase {
  cn_ordem_servico: TServiceOrderCode
  cn_item?: TServiceOrderCode
  qt_quantidade: number
  vl_unitario: number
}

export type TManutItemOrdemServico = IManutItemOrdemServicoBase &
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

export interface IManutOrdemServicoDialogProps extends IDialogProps {
  order?: IAdmOrdemServico | null
}

export interface IServiceOrderItemDialogProps extends IDialogProps {
  orderCode: TServiceOrderCode
  item?: TItemOrdemServico | null
  itemType?: TServiceOrderItemType
}

export interface IMoveServiceOrderDialogProps extends IDialogProps {
  order: IAdmOrdemServico | null
  action: TServiceOrderAction
}

export interface IServiceOrderDetailsDialogProps extends IDialogProps {
  order: IAdmOrdemServico | null
}
