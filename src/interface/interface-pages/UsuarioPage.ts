export interface IUpdateUser {
  an_nome: string
  bo_sts_reg: boolean
  cn_perfil?: string | number | null
}

export interface ICreateUserResponse {
  sucesso: boolean
  dados: IAdmUsuario
}

export interface IFormUsuario {
  an_nome: string
  an_email: string
  ca_senha: string
  cn_perfil: string | number | null
  bo_sts_reg: boolean
}

export interface IManutUserDialogProps {
  visible: boolean
  user?: IAdmUsuario | null
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
