import type { IFormPerfil } from '@/interface/pages/PerfilPage'

export class ProfileModel {
  static createForm(): IFormPerfil {
    return {
      an_descr: '',
      bo_sts_reg: true,
    }
  }
}
