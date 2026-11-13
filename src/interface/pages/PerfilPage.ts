export interface IAdmPerfil {
  cn_perfil?: string | number
  an_descr?: string
  bo_sts_reg?: boolean
  dt_inc: Date
  dt_alt: Date
}

export interface IManutProfile {
  cn_perfil?: number
  an_descr: string
  bo_sts_reg: boolean
  dt_inc?: Date
  dt_alt?: Date
}

export interface IFormProfile {
  an_descr: string
  bo_sts_reg: boolean
}
