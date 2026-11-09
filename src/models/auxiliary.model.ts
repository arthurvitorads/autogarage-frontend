import type { IFormAuxiliary, IFormDescription } from '@/interface/interface-pages/CadastroAuxiliar'

export class AuxiliaryModel {
  static createDescriptionForm(): IFormDescription {
    return { an_descr: '' }
  }

  static createForm(): IFormAuxiliary {
    return {
      an_descr: '',
      ca_sigla: '',
    }
  }
}
