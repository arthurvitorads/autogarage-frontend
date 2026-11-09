import { apiList, apiPage, apiRequest } from '@/services/api.service'
import type { IAdmProduto, IManutProduct } from '@/interface/interface-pages/ProdutoPage'
import type { IAdmServico, IManutService } from '@/interface/interface-pages/ServicoPage'
import type {
  IAdmCadastroAuxiliar,
  IManutAuxiliary,
} from '@/interface/interface-pages/CadastroAuxiliar'

export function getProdutos() {
  return apiList<IAdmProduto>('/produtos/listar', 'produtos')
}

export function getServicos() {
  return apiList<IAdmServico>('/servicos/listar', 'servicos')
}

export function getCadastrosAuxiliares() {
  return apiRequest<{
    cadastros: IAdmCadastroAuxiliar[]
  }>('/cadastrosAuxiliares/listar')
}

export function saveProduto(values: IManutProduct) {
  return apiRequest<IAdmProduto>(
    values.cn_produto === undefined ? '/produtos' : '/produtos/atualizar',
    values,
  )
}

export function saveServico(values: IManutService) {
  return apiRequest<IAdmServico>(
    values.cn_servico === undefined ? '/servicos' : '/servicos/atualizar',
    values,
  )
}

export function saveCadastroAuxiliar(values: IManutAuxiliary) {
  return apiRequest<IAdmCadastroAuxiliar>(
    values.cn_cadastro === undefined ? '/cadastrosAuxiliares' : '/cadastrosAuxiliares/atualizar',
    values,
  )
}

export function getProdutosPagina(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string> = {},
) {
  return apiPage<IAdmProduto>('/produtos/listar', 'produtos', page, limit, search, filters)
}

export function getServicosPagina(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string> = {},
) {
  return apiPage<IAdmServico>('/servicos/listar', 'servicos', page, limit, search, filters)
}
