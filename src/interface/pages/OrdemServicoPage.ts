import type { TItemOrdemServico } from '@/interface/tables'
import type { IAdmOrdemServico } from '@/interface/tables'
import type { IDialogProps } from '@/interface/dialog'
import type { ITipoPessoa } from '@/interface/enum'

export type TServiceOrderStatus = 'ABERTO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO'
export type TServiceOrderAction = 'INICIAR' | 'FINALIZAR' | 'CANCELAR'

export type TServiceOrderCode = string | number

export interface IClienteOrdemServico {
  cn_pessoa: string | number
  ca_tipo: ITipoPessoa
  an_nome: string | null
  an_razao_social: string | null
  ca_cpf: string | null
  ca_cnpj: string | null
}

export interface IFormClassificacaoOrdemServico {
  an_descr: string
  ca_cor: string
  bo_padrao: boolean
}

export interface IManutClassificacaoOrdemServico extends IFormClassificacaoOrdemServico {
  cn_classificacao_os?: TServiceOrderCode
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
  cn_classificacao_os: TServiceOrderCode | null
  dt_entrada: string
  dt_previsao: string
  cn_responsavel: TServiceOrderCode | null
  an_solicitacao: string
  an_obs: string
}

// Contratos de manutenção e resposta da API de ordens.
export interface IManutOrdemServico extends IServiceOrderVehicle {
  cn_ordem_servico?: TServiceOrderCode
  cn_pessoa: string | number
  cn_classificacao_os: TServiceOrderCode
  dt_entrada: string
  dt_previsao: string | null
  cn_responsavel?: TServiceOrderCode | null
  an_solicitacao: string
  an_obs: string
  evidencias?: IServiceOrderEvidenceInput[]
}

export interface IServiceOrderEvidenceInput {
  an_nome: string
  ca_mime: string
  bl_imagem: string
}

export interface IServiceOrderEvidence extends IServiceOrderEvidenceInput {
  cn_evidencia: string
}

export interface IServiceOrderEmployee {
  cn_pessoa: string
  an_nome: string
}

export type TServiceOrderItemType = 'PRODUTO' | 'SERVICO'

export interface IFormItemOrdemServico {
  ca_tipo: TServiceOrderItemType
  cn_produto: TServiceOrderCode | null
  cn_servico: TServiceOrderCode | null
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
