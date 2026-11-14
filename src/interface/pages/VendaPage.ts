import type { TItemOrdemServico } from '@/interface/tables'
import type { IDialogProps } from '@/interface/dialog'
import type { IAdmOrdemServico, ICadPessoa, IAdmVenda } from '@/interface/tables'
import type { IPageResponse } from '@/interface/api-response'

export type TBillableOrder = Pick<
  IAdmOrdemServico,
  'cn_ordem_servico' | 'cn_pessoa' | 'nu_numero' | 'an_cliente' | 'ca_status'
> & {
  itens: Pick<
    TItemOrdemServico,
    'ca_tipo' | 'an_descr' | 'qt_quantidade' | 'vl_unitario' | 'vl_total'
  >[]
}

export type TSaleCustomer = Pick<
  ICadPessoa,
  'an_nome' | 'an_razao_social' | 'ca_cpf' | 'ca_cnpj' | 'an_email' | 'an_telefone'
> & {
  endereco:
    | (Pick<NonNullable<ICadPessoa['endereco']>, 'an_logradouro' | 'an_numero' | 'an_cidade'> & {
        estado: { ca_uf: string } | null
      })
    | null
}

export interface IFormItemVenda {
  ca_tipo: 'PRODUTO' | 'SERVICO'
  cn_referencia: number | null
  qt_quantidade: number | null
  vl_unitario: number | null
}

export interface IManutItemVenda {
  ca_tipo: 'PRODUTO' | 'SERVICO'
  cn_produto: number | null
  cn_servico: number | null
  qt_quantidade: number
  vl_unitario: number
}

export interface IManutVenda {
  cn_pessoa: string | number
  cn_ordem_servico?: string | number
  ca_chave_requisicao: string
  an_obs: string
  itens?: IManutItemVenda[]
}

export interface ITimeReport {
  cn_item: string
  cn_ordem_servico: string
  nu_ordem: number
  an_descr: string
  an_cliente: string
  an_responsavel: string
  qt_quantidade: number
  qt_tempo_segundos: number
  dt_finalizacao: string
  intervalos: { dt_inicio: string; dt_fim: string; qt_segundos: number; ca_encerramento: string }[]
}

export interface ITimeReportResponse extends IPageResponse<ITimeReport> {
  resumo: {
    qt_servicos: number
    qt_media_segundos: number
    qt_menor_segundos: number
    qt_maior_segundos: number
  }
}

export interface ISaleReportResponse extends IPageResponse<IAdmVenda> {
  resumo: { qt_vendas: number; vl_total: number }
}
export type TSaleOrigin = 'DIRETA' | 'ORDEM_SERVICO'

export interface ISaleDraftItem extends IManutItemVenda {
  an_descr: string
  vl_total: number
}

export interface IFormVenda {
  origin: TSaleOrigin
  personId: string | number | null
  orderId: string | number | null
  notes: string
  requestKey: string
  items: ISaleDraftItem[]
}

export interface IManutVendaDialogProps extends IDialogProps {
  order?: IAdmOrdemServico | null
}

export interface ISaleDetailsDialogProps extends IDialogProps {
  sale: IAdmVenda | null
}
