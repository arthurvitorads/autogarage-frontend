import type { IAdmCadastroAuxiliar, IAdmProduto, IAdmServico } from '@/interface/tables'
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { IManutProduto } from '@/interface/pages/ProdutoPage'
import type { IManutServico } from '@/interface/pages/ServicoPage'
import type { IManutAuxiliar } from '@/interface/pages/CadastroAuxiliar'
import * as catalogService from '@/services/catalogo.service'
import { useUtilStore } from '@/stores/util.store'

export const useCatalogoStore = defineStore('catalogo', () => {
  const produtos = ref<IAdmProduto[]>([])
  const servicos = ref<IAdmServico[]>([])
  const cadastrosAuxiliares = ref<IAdmCadastroAuxiliar[]>([])
  const utilStore = useUtilStore()
  let sessionVersion = 0
  const categoriasProduto = computed(() =>
    cadastrosAuxiliares.value
      .filter((item) => item.ca_tipo === 'CATEGORIA_PRODUTO')
      .map((item) => item.an_descr),
  )
  const categoriasServico = computed(() =>
    cadastrosAuxiliares.value
      .filter((item) => item.ca_tipo === 'CATEGORIA_SERVICO')
      .map((item) => item.an_descr),
  )
  const marcasProduto = computed(() =>
    cadastrosAuxiliares.value
      .filter((item) => item.ca_tipo === 'MARCA')
      .map((item) => item.an_descr),
  )
  const unidadesProduto = computed(() =>
    cadastrosAuxiliares.value
      .filter((item) => item.ca_tipo === 'UNIDADE')
      .map((item) => ({ label: item.an_descr + ' (' + item.ca_sigla + ')', value: item.ca_sigla })),
  )

  async function loadCadastros() {
    const version = sessionVersion
    const result = await catalogService.getAuxiliaries()
    if (version === sessionVersion) cadastrosAuxiliares.value = result.dados
  }

  async function load() {
    const version = sessionVersion
    const [products, services, auxiliariesResponse] = await Promise.all([
      catalogService.getProducts(),
      catalogService.getServices(),
      catalogService.getAuxiliaries(),
    ])
    if (version !== sessionVersion) return
    produtos.value = products
    servicos.value = services
    cadastrosAuxiliares.value = auxiliariesResponse.dados
  }
  async function saveProduto(values: IManutProduto): Promise<IAdmProduto> {
    const { dados } = await catalogService.saveProduct(values)
    const index = produtos.value.findIndex((item) => item.cn_produto === dados.cn_produto)
    if (index < 0) produtos.value.push(dados)
    else produtos.value[index] = dados
    return dados
  }
  async function saveServico(values: IManutServico): Promise<IAdmServico> {
    const { dados } = await catalogService.saveService(values)
    const index = servicos.value.findIndex((item) => item.cn_servico === dados.cn_servico)
    if (index < 0) servicos.value.push(dados)
    else servicos.value[index] = dados
    return dados
  }
  async function saveCadastroAuxiliar(values: IManutAuxiliar): Promise<IAdmCadastroAuxiliar> {
    const { dados } = await catalogService.saveAuxiliary(values)
    const index = cadastrosAuxiliares.value.findIndex(
      (item) => item.cn_cadastro === dados.cn_cadastro,
    )
    if (index < 0) cadastrosAuxiliares.value.push(dados)
    else cadastrosAuxiliares.value[index] = dados
    return dados
  }
  watch(
    () => utilStore.user?.cn_usuario,
    () => {
      sessionVersion++
      produtos.value = []
      servicos.value = []
      cadastrosAuxiliares.value = []
    },
    { flush: 'sync' },
  )
  return {
    produtos,
    servicos,
    cadastrosAuxiliares,
    categoriasProduto,
    categoriasServico,
    marcasProduto,
    unidadesProduto,
    load,
    loadCadastros,
    saveProduto,
    saveServico,
    saveCadastroAuxiliar,
  }
})
