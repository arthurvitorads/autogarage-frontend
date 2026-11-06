import type { IFormLogin } from '@/interface/interface-pages/LoginPage'

export class LoginModel {
  static createForm(): IFormLogin {
    return {
      an_email: '',
      ca_senha: '',
    }
  }
}
