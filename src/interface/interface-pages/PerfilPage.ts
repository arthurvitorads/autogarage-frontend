export interface IManutPerfil {
  cn_perfil?: number
  an_nome?: string
  bo_sts_reg?: boolean
	dt_inc?: Date
	dt_alt?: Date
}

export interface IAdmPerfil {
  cn_perfil?: string | number
  an_descr?: string
  bo_sts_reg?: boolean
	dt_inc: Date
	dt_alt: Date
}

export interface IPerfilResponse {
  sucesso: boolean
  dados: {
    perfil: IAdmPerfil[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  }
}
