import type { IFormOrderClassification } from '@/interface/interface-pages/OrdemServicoPage'

export class OrderClassificationModel {
  static createForm(isFirst = false): IFormOrderClassification {
    return {
      an_descr: '',
      ca_cor: '#64748b',
      bo_padrao: isFirst,
    }
  }
}
