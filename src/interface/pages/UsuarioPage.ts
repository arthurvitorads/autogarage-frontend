import type { IAdmUsuario } from '@/interface/tables'
export interface IUpdateUser {
  an_nome: string
  bo_sts_reg: boolean
  cn_perfil?: string | number | null
}

export interface IFormUser {
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
