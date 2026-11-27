import type { IAdmServico } from '@/interface/tables'
import type { IDialogProps } from '@/interface/dialog'
export interface IFormServico {
  an_nome: string
  an_categoria: string | null
  vl_preco: number | null
  an_obs: string
  bo_sts_reg: boolean
}

export interface IManutServico extends Omit<IFormServico, 'vl_preco' | 'an_categoria'> {
  cn_servico?: number
  an_categoria: string
  vl_preco: number
}

export interface IManutServicoDialogProps extends IDialogProps {
  service?: IAdmServico | null
}
