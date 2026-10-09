import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUtilStore = defineStore('util', () => {
  const loadingCount = ref(0)
  const loading = computed(() => loadingCount.value > 0)

  function setLoading(value: boolean) {
    loadingCount.value += value ? 1 : -1
  }

  return {
    loading,
    setLoading
	}
})