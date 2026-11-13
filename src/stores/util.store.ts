import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { IMeUser } from '@/interface/interface-pages/LoginPage'
import type { TModule } from '@/interface/access'

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

  function canRead(module: TModule) {
    return (user.value?.acessos?.[module] ?? 3) <= 2
  }

  function canWrite(module: TModule) {
    return user.value?.acessos?.[module] === 1
  }

  function setLoading(value: boolean) {
    loadingCount.value = Math.max(0, loadingCount.value + (value ? 1 : -1))
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
    setUser,
    cleanUser,
    canRead,
    canWrite,
    normalizeError,
  }
})
