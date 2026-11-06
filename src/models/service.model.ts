import type { IFormService } from '@/interface/interface-pages/ServicoPage'

export class ServiceModel {
  static createForm(): IFormService {
    return {
      an_nome: '',
      an_categoria: null,
      vl_preco: 0,
      nu_tempo_estimado: null,
      an_obs: '',
      bo_sts_reg: true,
    }
  }
}
