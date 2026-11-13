import type { IPageResponse } from '@/interface/api-response'
import { ref } from 'vue'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'

export function usePesquisa<T>(
  request: (page: number, limit: number, search: string) => Promise<IPageResponse<T>>,
) {
  const records = ref<T[]>([])
  const total = ref(0)
  const firstRecord = ref(0)
  const limit = ref(20)
  const filter = ref('')
  const loadingGrid = ref(false)
  const { normalizeError } = useUtilStore()
  const { showError } = useAppToast()
  let searchText = ''

  async function load() {
    if (loadingGrid.value) return
    loadingGrid.value = true
    try {
      const result = await request(
        Math.floor(firstRecord.value / limit.value) + 1,
        limit.value,
        searchText,
      )
      records.value = result.dados as typeof records.value
      total.value = result.pagination.total
    } catch (error) {
      records.value = []
      total.value = 0
      showError(normalizeError(error))
    } finally {
      loadingGrid.value = false
    }
  }

  function search() {
    if (loadingGrid.value) return
    searchText = filter.value.trim()
    firstRecord.value = 0
    return load()
  }

  function changePage(event: { first: number; rows: number }) {
    if (loadingGrid.value) return
    firstRecord.value = event.first
    limit.value = event.rows
    return load()
  }

  return {
    records,
    total,
    firstRecord,
    limit,
    filter,
    loadingGrid,
    load,
    search,
    changePage,
  }
}
