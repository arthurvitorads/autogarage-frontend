import type { Person } from '@/models/pessoa'
import type { IAdmPerfil } from '@/interface/interface-pages/PerfilPage'
import type { IAdmProduto } from '@/interface/interface-pages/ProdutoPage'
import type { IAdmServico } from '@/interface/interface-pages/ServicoPage'
import type {
  IAdmOrdemServico,
  TServiceOrderAction,
  TServiceOrderCode,
  TItemOrdemServico,
  TServiceOrderItemType,
} from '@/interface/interface-pages/OrdemServicoPage'
import type { IAdmVenda } from '@/interface/interface-pages/VendaPage'

export interface IDialogProps {
  visible: boolean
}

export interface IManutPersonDialogProps extends IDialogProps {
  person?: Person | null
  people?: Person[]
}

export interface IManutProfileDialogProps extends IDialogProps {
  profile?: IAdmPerfil | null
}

export interface IProfileAccessDialogProps extends IDialogProps {
  profile: IAdmPerfil | null
}

export interface IManutProductDialogProps extends IDialogProps {
  product?: IAdmProduto | null
  products: IAdmProduto[]
}

export interface IManutServiceDialogProps extends IDialogProps {
  service?: IAdmServico | null
}

export interface IManutServiceOrderDialogProps extends IDialogProps {
  order?: IAdmOrdemServico | null
}

export interface IServiceOrderItemDialogProps extends IDialogProps {
  orderCode: TServiceOrderCode
  item?: TItemOrdemServico | null
  itemType?: TServiceOrderItemType
}

export interface IMoveServiceOrderDialogProps extends IDialogProps {
  order: IAdmOrdemServico | null
  action: TServiceOrderAction
}

export interface IServiceOrderDetailsDialogProps extends IDialogProps {
  order: IAdmOrdemServico | null
}

export interface ISaleDetailsDialogProps extends IDialogProps {
  sale: IAdmVenda | null
}

export interface IManutSaleDialogProps extends IDialogProps {
  order?: IAdmOrdemServico | null
}
export interface IReportPageProps {
  reportType: 'tempos' | 'vendas'
}
