import type { IConsultaCnpj } from '@/interface/util'
import { apiRequest } from '@/services/api.service'

export const documentoDuplicado = 'O documento já está sendo utilizado em outro cadastro.'

export async function consultarDocumento(
  campo: 'ca_cpf' | 'ca_cnpj',
  documento: string,
  codigoPessoa?: string | number,
  signal?: AbortSignal,
) {
  const { dados } = await apiRequest<{ bo_uso: boolean }>(
    '/pessoa/document',
    { [campo]: documento, cn_pessoa: codigoPessoa },
    signal,
  )
  return dados
}

export async function consultarCnpj(cnpj: string, codigoPessoa?: string | number) {
  const { dados } = await apiRequest<IConsultaCnpj | null>('/pessoa/document/cnpj', {
    ca_cnpj: cnpj,
    cn_pessoa: codigoPessoa,
  })
  return dados
}
