import type { IFormProfile } from '@/interface/pages/PerfilPage'

export class ProfileModel {
  static createForm(): IFormProfile {
    return {
      an_descr: '',
      bo_sts_reg: true,
    }
  }
}
