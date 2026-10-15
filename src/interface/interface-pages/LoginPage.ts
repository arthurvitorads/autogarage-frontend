export interface IMeResponse {
  sucesso: boolean,
  dados: IMeUser
}
export interface IMeUser {
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