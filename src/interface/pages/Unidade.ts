export interface IFormUnidade {
  an_descr: string
  ca_sigla: string
}

export interface IManutUnidade extends IFormUnidade {
  cn_unidade?: number
}

export interface ICadUnidade extends IFormUnidade {
  cn_unidade: number
  dt_inc: string
  dt_alt: string
}
