export interface IFormServico {
  an_nome: string
  an_categoria: string | null
  vl_preco: number | null
  nu_tempo_estimado: number | null
  an_obs: string
  bo_sts_reg: boolean
}

export interface IManutServico extends Omit<IFormServico, 'vl_preco' | 'nu_tempo_estimado' | 'an_categoria'> {
  cn_servico?: number
  an_categoria: string
  vl_preco: number
  nu_tempo_estimado?: number
}

export interface IAdmServico extends IManutServico {
  cn_servico: number
}
