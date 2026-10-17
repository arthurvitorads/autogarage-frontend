import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { IEnderecoViaCep, IViaCepResponse } from '@/interface/util'

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
    setUser,
    cleanUser,
    normalizeError
  }
})
