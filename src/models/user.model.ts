import type { IFormUser } from '@/interface/pages/UsuarioPage'

export class UserModel {
  static createForm(): IFormUser {
    return {
      an_nome: '',
      an_email: '',
      ca_senha: '',
      cn_perfil: null,
      bo_sts_reg: true,
    }
  }
}
