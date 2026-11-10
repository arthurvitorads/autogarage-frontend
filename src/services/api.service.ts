import { auth } from '@/services/firebase.service'
import { API_URL } from '@/constants/utils'
import type { IApiErrorResponse, IApiResponse, IPageResponse } from '@/interface/api-response'

export async function apiRequest<T, TResponse extends IApiResponse<T> = IApiResponse<T>>(
  endpoint: string | URL,
  values: unknown = {},
  signal?: AbortSignal,
): Promise<TResponse> {
  await auth.authStateReady()
  signal?.throwIfAborted()

  const user = auth.currentUser
  if (!user) throw new Error('Usuário não autenticado.')

  const token = await user.getIdToken()
  const url = typeof endpoint === 'string' ? `${String(API_URL).replace(/\/$/, '')}${endpoint}` : endpoint
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
    signal,
  })
  const result = (await response.json().catch(() => {
    signal?.throwIfAborted()
    return null
  })) as TResponse | IApiErrorResponse | null

  if (!response.ok || result?.sucesso !== true || !('dados' in result)) {
    const message = result?.sucesso === false ? result.erro : undefined
    throw new Error(
      message ||
        (response.status === 429
          ? 'Limite de requisições excedido.'
          : 'Erro ao executar o processo.'),
    )
  }

  return result
}

export async function apiList<T>(endpoint: string): Promise<T[]> {
  const records: T[] = []
  let page = 1
  let hasNextPage: boolean
  do {
    const { dados, pagination } = await apiPage<T>(endpoint, page, 100)
    records.push(...dados)
    hasNextPage = pagination.hasNextPage
    page++
  } while (hasNextPage)
  return records
}

export function apiPage<T>(
  endpoint: string,
  page: number,
  limit: number,
  search = '',
  filters: Record<string, string> = {},
) {
  return apiRequest<T[], IPageResponse<T>>(endpoint, { page, limit, search, ...filters })
}
