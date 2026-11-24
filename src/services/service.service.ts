import type { IAdmServico } from '@/interface/tables'
import type { IManutServico } from '@/interface/pages/ServicoPage'
import { apiPage, apiRequest } from '@/services/api.service'

export function saveService(values: IManutServico) {
  return apiRequest<IAdmServico>('/servicos/manut', values)
}

export function getServicesPage(
  page: number,
  limit: number,
  search: string,
  filters: Record<string, string> = {},
) {
  return apiPage<IAdmServico>('/servicos/view', page, limit, search, filters)
}
