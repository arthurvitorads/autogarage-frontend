import { auth } from '@/services/firebase.service'
import { API_URL } from '@/constants/utils'

export interface IApiResponse<T> {
  sucesso: boolean;
  dados: T
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean
}

export async function apiRequest<T>(endpoint: string, values?: unknown): Promise<IApiResponse<T>> {
  const user = auth.currentUser
  if (!user)
    throw new Error('Usuário não autenticado.')
  const token = await user.getIdToken()
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: values === undefined ? 'GET' : 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(values === undefined ? {} : { body: JSON.stringify(values) }),
  })
  const result = await response.json()
  if (!response.ok || !result.sucesso)
    throw new Error(result.erro || 'Erro ao executar o processo.')
  return result as IApiResponse<T>
}

// The dashboard and selection fields need the complete list, not just the first page.
export async function apiList<T>(endpoint: string, key: string): Promise<T[]> {
  const registros: T[] = []
  let page = 1
  let hasNextPage: boolean
  do {
    const result = await apiRequest<Record<string, T[]> & {
      pagination: IPagination
    }>(`${endpoint}?page=${page}&limit=100`)
    registros.push(...result.dados[key]!)
    hasNextPage = result.dados.pagination.hasNextPage
    page++
  } while (hasNextPage)
  return registros
}
