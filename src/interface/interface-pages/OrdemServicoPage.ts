import type { TipoPessoa } from '@/models/pessoa'

export type TStatusOrdemServico = 'ABERTO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO'
export type TAcaoOrdemServico = 'INICIAR' | 'FINALIZAR' | 'CANCELAR'

export type TCodigoOrdemServico = string | number

export interface IClienteOrdemServico {
  cn_pessoa: string | number
  an_nome: string
  an_documento: string
  tipo: TipoPessoa
}

export interface IFormClassificacaoOrdemServico {
  an_descr: string
  ca_cor: string
  bo_padrao: boolean
}

export interface IManutClassificacaoOrdemServico extends IFormClassificacaoOrdemServico {
  cn_classificacao?: TCodigoOrdemServico
}

export interface IClassificacaoOrdemServico extends IManutClassificacaoOrdemServico {
  cn_classificacao: TCodigoOrdemServico
}

export interface IVeiculoOrdemServico {
  an_placa: string
  an_marca: string
  an_modelo: string
  nu_ano: number | null
  an_cor: string
  qt_quilometragem: number | null
}

export interface IFormOrdemServico extends IVeiculoOrdemServico {
  cn_pessoa: string | number | null
  cn_classificacao: TCodigoOrdemServico | null
  dt_entrada: string
  dt_previsao: string
  an_responsavel: string
  an_solicitacao: string
  an_obs: string
}

// Contratos de manutenção e resposta da API de ordens.
export interface IManutOrdemServico {
  cn_ordem_servico?: TCodigoOrdemServico
  cn_pessoa: string | number
  cn_classificacao: TCodigoOrdemServico
  dt_entrada: string
  dt_previsao: string | null
  an_responsavel: string
  veiculo: IVeiculoOrdemServico
  an_solicitacao: string
  an_obs: string
}

export type TTipoItemOrdemServico = 'PRODUTO' | 'SERVICO'

export interface IFormItemOrdemServico {
  ca_tipo: TTipoItemOrdemServico
  cn_referencia: TCodigoOrdemServico | null
  qt_quantidade: number | null
  vl_unitario: number | null
}

interface IManutItemOrdemBase {
  cn_ordem_servico: TCodigoOrdemServico
  cn_item?: TCodigoOrdemServico
  qt_quantidade: number
  vl_unitario: number
}

export type TManutItemOrdemServico = IManutItemOrdemBase & (
  {
    ca_tipo: 'PRODUTO';
    cn_produto: TCodigoOrdemServico
  } |
  {
    ca_tipo: 'SERVICO';
    cn_servico: TCodigoOrdemServico
  }
)

export type TItemOrdemServico = TManutItemOrdemServico & {
  cn_item: TCodigoOrdemServico
  an_descr: string
  ca_unidade: string
  vl_total: number
}

export interface IAdmOrdemServico extends IManutOrdemServico {
  ca_status: TStatusOrdemServico
  an_motivo_cancelamento: string
  dt_inicio: string | null
  dt_finalizacao: string | null
  dt_cancelamento: string | null
  cn_ordem_servico: TCodigoOrdemServico
  nu_numero: number
  an_cliente: string
  itens: TItemOrdemServico[]
}
