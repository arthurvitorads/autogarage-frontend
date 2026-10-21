import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import type { ICnpjBrasilApiResponse, IEnderecoViaCep, IViaCepResponse } from '@/interface/util'

import { unMaskDocument, validateCNPJ } from '@/services/util.service'

import { IMeUser } from '@/interface/interface-pages/LoginPage'

export const useUtilStore = defineStore('util', () => {
  const loadingCount = ref(0)

  const loading = computed(() => loadingCount.value > 0)

  const user = ref<IMeUser | null>(null)

  function setUser(dados: IMeUser | null) {
    user.value = dados
  }

  function cleanUser() {
    user.value = null
  }

  function setLoading(value: boolean) {
    loadingCount.value = Math.max(0, loadingCount.value + (value ? 1 : -1))
  }

  async function fetchCep(cep: string): Promise<IEnderecoViaCep> {

    const cleanCep = cep.replace(/\D/g, '')

    if (cleanCep.length !== 8) {
      throw new Error('CEP inválido.')
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)

    if (!response.ok) {
      throw new Error(
        'Não foi possível consultar o CEP.',
      )
    }

    const data = (await response.json()) as IViaCepResponse

    if (data.erro) {
      throw new Error('CEP não encontrado ou incorreto.')
    }

    return data
  }

  async function fetchCnpj(cnpj: string): Promise<ICnpjBrasilApiResponse | null> {
    const cleanCnpj = unMaskDocument(cnpj).toUpperCase()

    if (!validateCNPJ(cleanCnpj))
      throw new Error('Informe um CNPJ válido.')

    let response: Response

    try {
      response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
        signal: AbortSignal.timeout(10_000),
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError')
        throw new Error('A consulta do CNPJ demorou para responder. Tente novamente.')

      throw new Error('Não foi possível consultar o CNPJ. Verifique sua conexão e tente novamente.')
    }

    if (response.status === 404) return null

    if (response.status === 400)
      throw new Error('O serviço de consulta não aceitou este CNPJ.')

    if (response.status === 429)
      throw new Error('Limite de consultas de CNPJ excedido. Aguarde alguns instantes e tente novamente.')

    if (!response.ok)
      throw new Error('O serviço de consulta de CNPJ está indisponível. Tente novamente mais tarde.')

    let data: ICnpjBrasilApiResponse

    try {
      data = (await response.json()) as ICnpjBrasilApiResponse
    } catch {
      throw new Error('O serviço retornou uma resposta inválida para este CNPJ. Tente novamente.')
    }

    if (!data || typeof data.cnpj !== 'string' || unMaskDocument(data.cnpj).toUpperCase() !== cleanCnpj ||
      typeof data.razao_social !== 'string' || !data.razao_social.trim())
      throw new Error('O serviço retornou dados inválidos para este CNPJ. Tente novamente.')

    return data
  }

  function normalizeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message
    }

    if (typeof error === 'string') {
      return error
    }

    return 'Ocorreu um erro inesperado.'
  }

  return {
    loading,
    user,
    setLoading,
    fetchCep,
    fetchCnpj,
    setUser,
    cleanUser,
    normalizeError
  }
})
