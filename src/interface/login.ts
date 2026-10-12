export interface IUserResponse {
  autenticado: boolean
  usuario: IUser
}
export interface IUser {
  cn_usuario?: number
  ca_id_firebase?: string
  an_email?: string
  an_nome?: string
  bo_sts_reg?: boolean
}

export interface IFormLogin {
  an_email: string
  ca_senha: string
}