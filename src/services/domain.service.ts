import { apiRequest } from '@/services/api.service'

import { API_URL } from '@/constants/utils'

import type { DomainOption } from '@/interface/util'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function readPath(value: unknown, path: string): unknown {
  return path
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), value)
}

export function extractDomainOptions(response: unknown, path: string): DomainOption[] {
  let data = readPath(response, path)

  if (isRecord(data)) {
    const lists = Object.values(data).filter(Array.isArray)
    if (lists.length === 1) data = lists[0]
  }
  if (!Array.isArray(data)) {
    throw new Error('A consulta retornou uma lista de opções inválida.')
  }

  return data.filter((option): option is DomainOption => {
    if (!isRecord(option)) return false

    const validId =
      typeof option.id === 'string'
        ? option.id.trim() !== ''
        : typeof option.id === 'number' && Number.isFinite(option.id)

    return validId && typeof option.an_descr === 'string' && option.an_descr.trim() !== ''
  })
}

export async function getDomainOptions(
  endpoint: string,
  optionsPath = 'dados',
  params: Record<string, string | number | boolean> = {},
  signal?: AbortSignal,
): Promise<DomainOption[]> {
  if (!endpoint.trim()) return []

  const base = new URL(`${String(API_URL).replace(/\/$/, '')}/`, window.location.origin)
  const url = new URL(endpoint.replace(/^\//, ''), base)

  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new Error('O endpoint deve pertencer à API do sistema.')
  }

  const values = { ...Object.fromEntries(url.searchParams), ...params }
  url.search = ''
  const response = await apiRequest<unknown>(url, values, signal)

  return extractDomainOptions(response, optionsPath)
}
