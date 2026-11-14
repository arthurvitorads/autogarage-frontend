import type { IAdmPerfil } from '@/interface/tables'
import type { IDialogProps } from '@/interface/dialog'
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

export interface IManutProfileDialogProps extends IDialogProps {
  profile?: IAdmPerfil | null
}

export interface IProfileAccessDialogProps extends IDialogProps {
  profile: IAdmPerfil | null
}
