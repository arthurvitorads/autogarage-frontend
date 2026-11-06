import type { IFormAuxiliary } from '@/interface/interface-pages/CadastroAuxiliar'

export class AuxiliaryModel {
  static createForm(): IFormAuxiliary {
    return {
      an_descr: '',
      ca_sigla: '',
    }
  }
}
