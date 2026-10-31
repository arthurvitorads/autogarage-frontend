import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type {
  IAdmOrdemServico, IClienteOrdemServico, IManutOrdemServico, IManutClassificacaoOrdemServico,
  IClassificacaoOrdemServico, TItemOrdemServico, TManutItemOrdemServico, TCodigoOrdemServico
} from '@/interface/interface-pages/OrdemServicoPage'
import * as ordemService from '@/services/ordem-api.service'
import { useUtilStore } from '@/stores/util.store'
import { useCatalogoStore } from '@/stores/catalogo.store'

export const useOrdemServicoStore = defineStore('ordem-servico', () => {
  const ordens = ref<IAdmOrdemServico[]>([])
  const classificacoes = ref<IClassificacaoOrdemServico[]>([])
  const clientes = ref<IClienteOrdemServico[]>([])
  const utilStore = useUtilStore()
  const catalogoStore = useCatalogoStore()
  let versaoSessao = 0
  const classificacaoPadrao = computed(() => classificacoes.value.find(item => item.bo_padrao) ?? null)

  async function loadParametros() {
    const versao = versaoSessao
    const [listaClassificacoes, listaClientes] = await Promise.all([ordemService.getClassificacoes(), ordemService.getClientes()])
    if (versao !== versaoSessao)
      return
    classificacoes.value = listaClassificacoes.dados.classificacoes
    clientes.value = listaClientes.dados.clientes
  }

  async function load() {
    const versao = versaoSessao
    const [listaOrdens, listaClassificacoes, listaClientes] = await Promise.all([
      ordemService.getOrdens(), ordemService.getClassificacoes(), ordemService.getClientes(), catalogoStore.load(),
    ])
    if (versao !== versaoSessao)
      return
    ordens.value = listaOrdens
    classificacoes.value = listaClassificacoes.dados.classificacoes
    clientes.value = listaClientes.dados.clientes
  }
  async function saveClassificacao(values: IManutClassificacaoOrdemServico): Promise<IClassificacaoOrdemServico> {
    const { dados } = await ordemService.saveClassificacao(values)
    if (dados.bo_padrao)
      classificacoes.value.forEach(item => {
        item.bo_padrao = false
      })
    const index = classificacoes.value.findIndex(item => String(item.cn_classificacao) === String(dados.cn_classificacao))
    if (index < 0)
      classificacoes.value.push(dados)
    else
      classificacoes.value[index] = dados
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
  async function movimentar(codigo: TCodigoOrdemServico, acao: import('@/interface/interface-pages/OrdemServicoPage').TAcaoOrdemServico, motivo: string) {
    const { dados } = await ordemService.movimentarOrdem(codigo, acao, motivo)
    const index = ordens.value.findIndex(item => String(item.cn_ordem_servico) === String(codigo))
    if (index >= 0)
      ordens.value[index] = dados
    else
      ordens.value.push(dados)
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
    classificacoes.value = []
    clientes.value = []
  }, { flush: 'sync' })
  return {
    ordens,
    classificacoes,
    clientes,
    classificacaoPadrao,
    load,
    loadParametros,
    saveClassificacao,
    saveOrdem,
    movimentar,
    saveItem,
    removeItem
  }
})
