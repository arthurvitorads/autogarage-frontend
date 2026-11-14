import type { IManutEndereco, IManutPessoa } from '@/interface/pages/PessoaPage'
import type { IManutProduto } from '@/interface/pages/ProdutoPage'
import type { IManutServico } from '@/interface/pages/ServicoPage'
import type { IManutAuxiliar } from '@/interface/pages/CadastroAuxiliar'
import type {
  IManutClassificacaoOrdemServico,
  IManutOrdemServico,
  TManutItemOrdemServico,
  TServiceOrderStatus,
  TServiceOrderCode,
} from '@/interface/pages/OrdemServicoPage'

export interface IAdmCadastroAuxiliar extends IManutAuxiliar {
  cn_cadastro: number
}

export interface IClassificacaoOrdemServico extends IManutClassificacaoOrdemServico {
  cn_classificacao: TServiceOrderCode
}

export interface IAdmOrdemServico extends IManutOrdemServico {
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

export interface IAdmPerfil {
  cn_perfil?: string | number
  an_descr?: string
  bo_sts_reg?: boolean
  dt_inc: Date
  dt_alt: Date
}

export interface ICadEndereco extends Omit<IManutEndereco, 'cn_estado'> {
  cn_endereco: string
  cn_estado: string | null
  cn_pessoa: string
  bo_sts_reg: boolean
  dt_inc: string
  dt_alt: string
}

export interface ICadPessoa extends Omit<IManutPessoa, 'endereco'> {
  cn_pessoa: string
  dt_inc: string
  dt_alt: string
  endereco: ICadEndereco | null
}

export interface IAdmProduto extends IManutProduto {
  cn_produto: number
}

export interface IAdmServico extends IManutServico {
  cn_servico: number
}

export interface IAdmUsuario {
  cn_usuario?: string | number
  ca_id_firebase?: string
  an_email?: string
  an_nome?: string
  an_perfil?: string
  cn_perfil?: string | number | null
  bo_sts_reg?: boolean
  dt_inc: Date
  dt_alt: Date
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

export interface IEndEstado {
  cn_estado: string
  an_descr: string
  ca_uf: string
  ca_pais: string
  dt_inc: string
  dt_alt: string
}

export type TItemOrdemServico = TManutItemOrdemServico & {
  ca_status_servico: 'PENDENTE' | 'EM_ANDAMENTO' | 'PAUSADO' | 'FINALIZADO' | 'CANCELADO'
  qt_tempo_segundos: number
  dt_inicio_tempo: string | null
  dt_servidor: string
  cn_item: TServiceOrderCode
  an_descr: string
  ca_unidade: string
  vl_total: number
}
