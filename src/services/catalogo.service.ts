import { apiList, apiPage, apiRequest } from '@/services/api.service'
import type { IAdmProduto, IManutProduct } from '@/interface/interface-pages/ProdutoPage'
import type { IAdmServico, IManutService } from '@/interface/interface-pages/ServicoPage'
import type {
  IAdmCadastroAuxiliar,
  IManutAuxiliary,
} from '@/interface/interface-pages/CadastroAuxiliar'

export function getProdutos() {
  return apiList<IAdmProduto>('/produtos', 'produtos')
}

export function getServicos() {
  return apiList<IAdmServico>('/servicos', 'servicos')
}

export function getCadastrosAuxiliares() {
  return apiRequest<{
    cadastros: IAdmCadastroAuxiliar[]
  }>('/cadastrosAuxiliares')
}

export function saveProduto(values: IManutProduct) {
  return apiRequest<IAdmProduto>(
    `/produtos${values.cn_produto === undefined ? '' : '/' + values.cn_produto}`,
    values,
  )
}

export function saveServico(values: IManutService) {
  return apiRequest<IAdmServico>(
    `/servicos${values.cn_servico === undefined ? '' : '/' + values.cn_servico}`,
    values,
  )
}

export function saveCadastroAuxiliar(values: IManutAuxiliary) {
  return apiRequest<IAdmCadastroAuxiliar>(
    '/cadastrosAuxiliares' + (values.cn_cadastro === undefined ? '' : '/' + values.cn_cadastro),
    values,
  )
}

export function getProdutosPagina(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string> = {},
) {
  return apiPage<IAdmProduto>('/produtos', 'produtos', page, limit, search, filters)
}

export function getServicosPagina(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string> = {},
) {
  return apiPage<IAdmServico>('/servicos', 'servicos', page, limit, search, filters)
}
