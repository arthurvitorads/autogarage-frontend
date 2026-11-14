import type { IFormClassificacaoOrdemServico } from '@/interface/pages/OrdemServicoPage'

export class OrderClassificationModel {
  static createForm(isFirst = false): IFormClassificacaoOrdemServico {
    return {
      an_descr: '',
      ca_cor: '#64748b',
      bo_padrao: isFirst,
    }
  }
}
