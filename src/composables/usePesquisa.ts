import { ref } from 'vue'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'

export function usePesquisa<T>(request: (page: number, limit: number, search: string) => Promise<{ registros: T[]; total: number }>) {
  const registros = ref<T[]>([])
  const total = ref(0)
  const primeiroRegistro = ref(0)
  const limite = ref(20)
  const filtro = ref('')
  const loadingGrid = ref(false)
  const { normalizeError } = useUtilStore()
  const toast = useAppToast()
  let pesquisa = ''

  async function load() {
    if (loadingGrid.value)
      return
    loadingGrid.value = true
    try {
      const resultado = await request(Math.floor(primeiroRegistro.value / limite.value) + 1, limite.value, pesquisa)
      registros.value = resultado.registros as typeof registros.value
      total.value = resultado.total
    } catch (error) {
      registros.value = []
      total.value = 0
      toast.error(normalizeError(error))
    } finally {
      loadingGrid.value = false
    }
  }

  function search() {
    if (loadingGrid.value)
      return
    pesquisa = filtro.value.trim()
    primeiroRegistro.value = 0
    return load()
  }

  function changePage(event: { first: number; rows: number }) {
    if (loadingGrid.value)
      return
    primeiroRegistro.value = event.first
    limite.value = event.rows
    return load()
  }

  return { registros, total, primeiroRegistro, limite, filtro, loadingGrid, load, search, changePage }
}
