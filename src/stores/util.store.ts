import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { IEnderecoViaCep, IViaCepResponse } from '@/interface/util'

export const useUtilStore = defineStore('util', () => {
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)

  function setLoading(value: boolean) {
    loadingCount.value += value ? 1 : -1
  }

  async function fetchCEP(cep: string): Promise<IEnderecoViaCep> {

    const cepLimpo = cep.replace(/\D/g, '')

    if (cepLimpo.length !== 8) {
      throw new Error('CEP inválido.')
    }

    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)

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

  return {
    loading,
    setLoading,
    fetchCEP
  }
})