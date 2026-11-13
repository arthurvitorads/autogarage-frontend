import type { TModuleAccess } from '@/interface/access'

export interface IMeUser {
  cn_usuario?: string
  cn_perfil?: string
  acessos: TModuleAccess
  ca_id_firebase?: string
  an_email?: string
  an_nome?: string
  an_perfil?: string | null
  bo_sts_reg?: boolean
}

export interface IFormLogin {
  an_email: string
  ca_senha: string
}
