import type { TItemOrdemServico } from '@/interface/tables'
import type { IClassificacaoOrdemServico, IAdmOrdemServico } from '@/interface/tables'
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type {
  IClienteOrdemServico,
  IManutServiceOrder,
  IManutOrderClassification,
  TManutServiceOrderItem,
  TServiceOrderCode,
} from '@/interface/pages/OrdemServicoPage'
import * as orderService from '@/services/ordem-api.service'
import { useUtilStore } from '@/stores/util.store'

export const useOrdemServicoStore = defineStore('ordem-servico', () => {
  const ordens = ref<IAdmOrdemServico[]>([])
  const classificacoes = ref<IClassificacaoOrdemServico[]>([])
  const clientes = ref<IClienteOrdemServico[]>([])
  const utilStore = useUtilStore()
  let sessionVersion = 0
  const classificacaoPadrao = computed(
    () => classificacoes.value.find((item) => item.bo_padrao) ?? null,
  )

  async function loadParametros() {
    const version = sessionVersion
    const [classificationsResponse, customersResponse] = await Promise.all([
      orderService.getClassifications(),
      utilStore.canWrite('ORDEM_SERVICO') ? orderService.getCustomers() : null,
    ])
    if (version !== sessionVersion) return
    classificacoes.value = classificationsResponse.dados
    clientes.value = customersResponse?.dados ?? []
  }

  async function loadOrder(id: TServiceOrderCode) {
    const version = sessionVersion
    const { dados } = await orderService.getOrder(id)
    if (version !== sessionVersion) return
    const index = ordens.value.findIndex((order) => String(order.cn_ordem_servico) === String(id))
    if (index < 0) ordens.value.push(dados)
    else ordens.value[index] = dados
  }
  async function saveClassificacao(
    values: IManutOrderClassification,
  ): Promise<IClassificacaoOrdemServico> {
    const { dados } = await orderService.saveClassification(values)
    if (dados.bo_padrao)
      classificacoes.value.forEach((item) => {
        item.bo_padrao = false
      })
    const index = classificacoes.value.findIndex(
      (item) => String(item.cn_classificacao) === String(dados.cn_classificacao),
    )
    if (index < 0) classificacoes.value.push(dados)
    else classificacoes.value[index] = dados
    return dados
  }
  async function saveOrdem(values: IManutServiceOrder): Promise<IAdmOrdemServico> {
    const { dados } = await orderService.saveOrder(values)
    const index = ordens.value.findIndex(
      (item) => String(item.cn_ordem_servico) === String(dados.cn_ordem_servico),
    )
    if (index < 0) ordens.value.push(dados)
    else ordens.value[index] = dados
    return dados
  }
  async function movimentar(
    codigo: TServiceOrderCode,
    acao: import('@/interface/pages/OrdemServicoPage').TServiceOrderAction,
    motivo: string,
  ) {
    const { dados } = await orderService.moveOrder(codigo, acao, motivo)
    const index = ordens.value.findIndex((item) => String(item.cn_ordem_servico) === String(codigo))
    if (index >= 0) ordens.value[index] = dados
    else ordens.value.push(dados)
    return dados
  }

  async function saveItem(values: TManutServiceOrderItem): Promise<TItemOrdemServico> {
    const { dados } = await orderService.saveItem(values)
    const ordem = ordens.value.find(
      (item) => String(item.cn_ordem_servico) === String(values.cn_ordem_servico),
    )
    if (ordem) {
      const index = ordem.itens.findIndex((item) => String(item.cn_item) === String(dados.cn_item))
      if (index < 0) ordem.itens.push(dados)
      else ordem.itens[index] = dados
    }
    return dados
  }
  async function removeItem(codigoOrdem: TServiceOrderCode, codigoItem: TServiceOrderCode) {
    await orderService.removeItem(codigoOrdem, codigoItem)
    const ordem = ordens.value.find((item) => String(item.cn_ordem_servico) === String(codigoOrdem))
    if (ordem)
      ordem.itens = ordem.itens.filter((item) => String(item.cn_item) !== String(codigoItem))
  }
  watch(
    () => utilStore.user?.cn_usuario,
    () => {
      sessionVersion++
      ordens.value = []
      classificacoes.value = []
      clientes.value = []
    },
    { flush: 'sync' },
  )
  return {
    ordens,
    classificacoes,
    clientes,
    classificacaoPadrao,
    loadOrder,
    loadParametros,
    saveClassificacao,
    saveOrdem,
    movimentar,
    saveItem,
    removeItem,
  }
})
