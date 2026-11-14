import type { IFormAuxiliar, IFormDescricao } from '@/interface/pages/CadastroAuxiliar'

export class AuxiliaryModel {
  static createDescriptionForm(): IFormDescricao {
    return { an_descr: '' }
  }

  static createForm(): IFormAuxiliar {
    return {
      an_descr: '',
      ca_sigla: '',
    }
  }
}
