import type { IAdmOrdemServico } from '@/interface/tables'
import type { IFormSale, IFormSaleItem } from '@/interface/pages/VendaPage'

export class SaleModel {
  static createForm(order?: IAdmOrdemServico | null): IFormSale {
    return {
      origin: order ? 'ORDEM_SERVICO' : 'DIRETA',
      personId: order?.cn_pessoa ?? null,
      orderId: order?.cn_ordem_servico ?? null,
      notes: '',
      requestKey: crypto.randomUUID(),
      items: [],
    }
  }

  static createItem(): IFormSaleItem {
    return {
      ca_tipo: 'PRODUTO',
      cn_referencia: null,
      qt_quantidade: 1,
      vl_unitario: 0,
    }
  }
}
