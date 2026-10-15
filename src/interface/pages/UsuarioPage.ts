export interface IAdmUsuario {
  cn_usuario?: number
  ca_id_firebase?: string
  an_email?: string
  an_nome?: string
  bo_sts_reg?: boolean
	dt_inc: Date
	dt_alt: Date
}

export interface IUsuarioResponse {
  sucesso: boolean
  dados: {
    usuarios: IAdmUsuario[]
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
