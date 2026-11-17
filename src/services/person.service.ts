import type { ICadPessoa } from '@/interface/tables'
import { apiPage, apiRequest } from '@/services/api.service'

import type { IManutPessoa } from '@/interface/pages/PessoaPage'

export function getPeople(page = 1, limit = 20, search = '') {
  return apiPage<ICadPessoa>('/pessoa/listar', page, limit, search)
}

export function getPersonById(id: string | number) {
  return apiRequest<ICadPessoa>('/pessoa/detalhar', { cn_pessoa: id })
}

export function createPerson(values: IManutPessoa) {
  return apiRequest<ICadPessoa>('/pessoa', values)
}

export function updatePerson(id: string | number, values: IManutPessoa) {
  return apiRequest<ICadPessoa>('/pessoa/atualizar', { ...values, cn_pessoa: id })
}
