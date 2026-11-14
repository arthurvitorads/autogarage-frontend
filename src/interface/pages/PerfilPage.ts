import type { IAdmPerfil } from '@/interface/tables'
import type { IDialogProps } from '@/interface/dialog'
export interface IManutPerfil {
  cn_perfil?: number
  an_descr: string
  bo_sts_reg: boolean
  dt_inc?: Date
  dt_alt?: Date
}

export interface IFormPerfil {
  an_descr: string
  bo_sts_reg: boolean
}

export interface IManutPerfilDialogProps extends IDialogProps {
  profile?: IAdmPerfil | null
}

export interface IProfileAccessDialogProps extends IDialogProps {
  profile: IAdmPerfil | null
}
