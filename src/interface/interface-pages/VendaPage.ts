import type { IPagination } from '@/services/api.service'

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

export interface IRelatorioTempo {
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

export interface IRelatorioTempoResponse {
  servicos: IRelatorioTempo[]
  resumo: { qt_servicos: number; qt_media_segundos: number; qt_menor_segundos: number; qt_maior_segundos: number }
  pagination: IPagination
}

export interface IRelatorioVendaResponse {
  vendas: IAdmVenda[]
  resumo: { qt_vendas: number; vl_total: number }
  pagination: IPagination
}
