import { apiList, apiPage, apiRequest } from '@/services/api.service'
import type { IAdmProduto, IManutProduct } from '@/interface/pages/ProdutoPage'
import type { IAdmServico, IManutService } from '@/interface/pages/ServicoPage'
import type {
  IAdmCadastroAuxiliar,
  IManutAuxiliary,
} from '@/interface/pages/CadastroAuxiliar'

export interface ICatalogItemOption {
  cn_referencia: number
  an_nome: string
  ca_unidade: string
  vl_preco: number
}

export function getCatalogItemOptions() {
  return apiRequest<{ produtos: ICatalogItemOption[]; servicos: ICatalogItemOption[] }>(
    '/paramCatalogo',
  )
}

export function getProducts() {
  return apiList<IAdmProduto>('/produtos/listar')
}

export function getServices() {
  return apiList<IAdmServico>('/servicos/listar')
}

export function getAuxiliaries() {
  return apiRequest<IAdmCadastroAuxiliar[]>('/cadastrosAuxiliares/listar')
}

export function saveProduct(values: IManutProduct) {
  return apiRequest<IAdmProduto>(
    values.cn_produto === undefined ? '/produtos' : '/produtos/atualizar',
    values,
  )
}

export function saveService(values: IManutService) {
  return apiRequest<IAdmServico>(
    values.cn_servico === undefined ? '/servicos' : '/servicos/atualizar',
    values,
  )
}

export function saveAuxiliary(values: IManutAuxiliary) {
  return apiRequest<IAdmCadastroAuxiliar>(
    values.cn_cadastro === undefined ? '/cadastrosAuxiliares' : '/cadastrosAuxiliares/atualizar',
    values,
  )
}

export function getProductsPage(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string> = {},
) {
  return apiPage<IAdmProduto>('/produtos/listar', page, limit, search, filters)
}

export function getServicesPage(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string> = {},
) {
  return apiPage<IAdmServico>('/servicos/listar', page, limit, search, filters)
}
