import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type {
  IAdmOrdemServico, IClienteOrdemServico, IManutOrdemServico, IManutStatusOrdemServico,
  IStatusOrdemServico, TItemOrdemServico, TManutItemOrdemServico, TCodigoOrdemServico
} from '@/interface/interface-pages/OrdemServicoPage'
import * as ordemService from '@/services/ordem-api.service'
import { useUtilStore } from '@/stores/util.store'
import { useCatalogoStore } from '@/stores/catalogo.store'

export const useOrdemServicoStore = defineStore('ordem-servico', () => {
  const ordens = ref<IAdmOrdemServico[]>([])
  const status = ref<IStatusOrdemServico[]>([])
  const clientes = ref<IClienteOrdemServico[]>([])
  const utilStore = useUtilStore()
  const catalogoStore = useCatalogoStore()
  let versaoSessao = 0
  const statusPadrao = computed(() => status.value.find(item => item.bo_padrao) ?? null)

  async function load() {
    const versao = versaoSessao
    const [listaOrdens, listaStatus, listaClientes] = await Promise.all([
      ordemService.getOrdens(), ordemService.getStatus(), ordemService.getClientes(), catalogoStore.load(),
    ])
    if (versao !== versaoSessao)
      return
    ordens.value = listaOrdens
    status.value = listaStatus.dados.status
    clientes.value = listaClientes.dados.clientes
  }
  async function saveStatus(values: IManutStatusOrdemServico): Promise<IStatusOrdemServico> {
    const { dados } = await ordemService.saveStatus(values)
    if (dados.bo_padrao)
      status.value.forEach(item => {
        item.bo_padrao = false
      })
    const index = status.value.findIndex(item => String(item.cn_status) === String(dados.cn_status))
    if (index < 0)
      status.value.push(dados)
    else
      status.value[index] = dados
    return dados
  }
  async function saveOrdem(values: IManutOrdemServico): Promise<IAdmOrdemServico> {
    const { dados } = await ordemService.saveOrdem(values)
    const index = ordens.value.findIndex(item => String(item.cn_ordem_servico) === String(dados.cn_ordem_servico))
    if (index < 0)
      ordens.value.push(dados)
    else
      ordens.value[index] = dados
    return dados
  }
  async function saveItem(values: TManutItemOrdemServico): Promise<TItemOrdemServico> {
    const { dados } = await ordemService.saveItem(values)
    const ordem = ordens.value.find(item => String(item.cn_ordem_servico) === String(values.cn_ordem_servico))
    if (ordem) {
      const index = ordem.itens.findIndex(item => String(item.cn_item) === String(dados.cn_item))
      if (index < 0)
        ordem.itens.push(dados)
      else
        ordem.itens[index] = dados
    }
    return dados
  }
  async function removeItem(codigoOrdem: TCodigoOrdemServico, codigoItem: TCodigoOrdemServico) {
    await ordemService.removeItem(codigoOrdem, codigoItem)
    const ordem = ordens.value.find(item => String(item.cn_ordem_servico) === String(codigoOrdem))
    if (ordem)
      ordem.itens = ordem.itens.filter(item => String(item.cn_item) !== String(codigoItem))
  }
  watch(() => utilStore.user?.cn_usuario, () => {
    versaoSessao++
    ordens.value = []
    status.value = []
    clientes.value = []
  }, { flush: 'sync' })
  return {
    ordens,
    status,
    clientes,
    statusPadrao,
    load,
    saveStatus,
    saveOrdem,
    saveItem,
    removeItem
  }
})
