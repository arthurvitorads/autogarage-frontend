import type { IAdmOrdemServico } from '@/interface/tables'
import type { IFormVenda, IFormItemVenda } from '@/interface/pages/VendaPage'

export class SaleModel {
  static createForm(order?: IAdmOrdemServico | null): IFormVenda {
    return {
      ca_origem: order ? 'ORDEM_SERVICO' : 'DIRETA',
      cn_pessoa: order?.cn_pessoa ?? null,
      cn_ordem: order?.cn_ordem ?? null,
      an_obs: '',
      ca_chave_requisicao: crypto.randomUUID(),
      itens: [],
    }
  }

  static createItem(): IFormItemVenda {
    return {
      ca_tipo: 'PRODUTO',
      cn_produto: null,
      cn_servico: null,
      qt_quantidade: 1,
      vl_unitario: 0,
    }
  }
}
