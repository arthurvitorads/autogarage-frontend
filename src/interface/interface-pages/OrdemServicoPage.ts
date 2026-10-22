import type { TipoPessoa } from '@/models/pessoa'

export type TCodigoOrdemServico = string | number

export interface IClienteOrdemServico {
  cn_pessoa: string | number
  an_nome: string
  an_documento: string
  tipo: TipoPessoa
}

export interface IFormStatusOrdemServico {
  an_descr: string
  ca_cor: string
  bo_padrao: boolean
}

export interface IManutStatusOrdemServico extends IFormStatusOrdemServico {
  cn_status?: TCodigoOrdemServico
}

export interface IStatusOrdemServico extends IManutStatusOrdemServico {
  cn_status: TCodigoOrdemServico
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
  cn_status: TCodigoOrdemServico | null
  dt_entrada: string
  dt_previsao: string
  an_responsavel: string
  an_solicitacao: string
  an_obs: string
}

// Contratos provisórios: referências explícitas para a futura API.
export interface IManutOrdemServico {
  cn_ordem_servico?: TCodigoOrdemServico
  cn_pessoa: string | number
  cn_status: TCodigoOrdemServico
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
  { ca_tipo: 'PRODUTO'; cn_produto: TCodigoOrdemServico } |
  { ca_tipo: 'SERVICO'; cn_servico: TCodigoOrdemServico }
)

export type TItemOrdemServico = TManutItemOrdemServico & {
  cn_item: TCodigoOrdemServico
  an_descr: string
  ca_unidade: string
  vl_total: number
}

export interface IAdmOrdemServico extends IManutOrdemServico {
  cn_ordem_servico: TCodigoOrdemServico
  nu_numero: number
  an_cliente: string
  itens: TItemOrdemServico[]
}
