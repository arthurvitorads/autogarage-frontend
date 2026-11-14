import type { IAdmServico } from '@/interface/tables'
import type { IDialogProps } from '@/interface/dialog'
export interface IFormService {
  an_nome: string
  an_categoria: string | null
  vl_preco: number | null
  nu_tempo_estimado: number | null
  an_obs: string
  bo_sts_reg: boolean
}

export interface IManutService extends Omit<
  IFormService,
  'vl_preco' | 'nu_tempo_estimado' | 'an_categoria'
> {
  cn_servico?: number
  an_categoria: string
  vl_preco: number
  nu_tempo_estimado?: number
}

export interface IManutServiceDialogProps extends IDialogProps {
  service?: IAdmServico | null
}
