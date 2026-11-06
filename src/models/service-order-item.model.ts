import type { IFormServiceOrderItem } from '@/interface/interface-pages/OrdemServicoPage'

export class ServiceOrderItemModel {
  static createForm(itemType: 'PRODUTO' | 'SERVICO' = 'PRODUTO'): IFormServiceOrderItem {
    return {
      ca_tipo: itemType,
      cn_referencia: null,
      qt_quantidade: 1,
      vl_unitario: 0,
    }
  }
}
