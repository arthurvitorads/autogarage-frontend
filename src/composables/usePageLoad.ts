import { onMounted } from 'vue'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'

export function usePageLoad(load: () => Promise<void>) {
  const { setLoading, normalizeError } = useUtilStore()
  const { showError } = useAppToast()
  onMounted(async () => {
    setLoading(true)
    try {
      await load()
    } catch (error) {
      showError(normalizeError(error))
    } finally {
      setLoading(false)
    }
  })
}
