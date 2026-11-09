import type { IPagination } from '@/services/api.service'
import type {
  IAdmOrdemServico,
  TItemOrdemServico,
} from '@/interface/interface-pages/OrdemServicoPage'
import type { ICadPessoa } from '@/interface/interface-pages/PessoaPage'

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
  endereco: Pick<
    NonNullable<ICadPessoa['endereco']>,
    'an_logradouro' | 'an_numero' | 'an_cidade' | 'ca_uf'
  > | null
}

export interface IItemVenda {
  cn_item_venda: string
  ca_tipo: 'PRODUTO' | 'SERVICO'
  cn_produto: number | null
  cn_servico: number | null
  an_descr: string
  ca_unidade: string
  qt_quantidade: number
  vl_unitario: number
  vl_total: number
  qt_tempo_segundos: number
}

export interface IAdmVenda {
  cn_venda: string
  nu_numero: number
  cn_pessoa: string
  cn_ordem_servico: string | null
  ca_origem: 'ORDEM_SERVICO' | 'DIRETA'
  an_cliente: string
  ca_documento: string
  an_email: string
  an_telefone: string
  an_endereco: string
  an_obs: string
  dt_venda: string
  vl_total: number
  itens: IItemVenda[]
}

export interface IFormSaleItem {
  ca_tipo: 'PRODUTO' | 'SERVICO'
  cn_referencia: number | null
  qt_quantidade: number | null
  vl_unitario: number | null
}

export interface IManutSaleItem {
  ca_tipo: 'PRODUTO' | 'SERVICO'
  cn_produto: number | null
  cn_servico: number | null
  qt_quantidade: number
  vl_unitario: number
}

export interface IManutSale {
  cn_pessoa: string | number
  cn_ordem_servico?: string | number
  ca_chave_requisicao: string
  an_obs: string
  itens?: IManutSaleItem[]
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

export interface ITimeReportResponse {
  servicos: ITimeReport[]
  resumo: {
    qt_servicos: number
    qt_media_segundos: number
    qt_menor_segundos: number
    qt_maior_segundos: number
  }
  pagination: IPagination
}

export interface ISaleReportResponse {
  vendas: IAdmVenda[]
  resumo: { qt_vendas: number; vl_total: number }
  pagination: IPagination
}
export type TSaleOrigin = 'DIRETA' | 'ORDEM_SERVICO'

export interface ISaleDraftItem extends IManutSaleItem {
  an_descr: string
  vl_total: number
}

export interface IFormSale {
  origin: TSaleOrigin
  personId: string | number | null
  orderId: string | number | null
  notes: string
  requestKey: string
  items: ISaleDraftItem[]
}
