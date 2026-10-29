import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { IAdmProduto, IManutProduto } from '@/interface/interface-pages/ProdutoPage'
import type { IAdmServico, IManutServico } from '@/interface/interface-pages/ServicoPage'
import type { IAdmCadastroAuxiliar, IManutCadastroAuxiliar } from '@/interface/interface-pages/CadastroAuxiliar'
import * as catalogoService from '@/services/catalogo.service'
import { useUtilStore } from '@/stores/util.store'

export const useCatalogoStore = defineStore('catalogo', () => {
  const produtos = ref<IAdmProduto[]>([])
  const servicos = ref<IAdmServico[]>([])
  const cadastrosAuxiliares = ref<IAdmCadastroAuxiliar[]>([])
  const utilStore = useUtilStore()
  let versaoSessao = 0
  const categoriasProduto = computed(() => cadastrosAuxiliares.value.filter(item => item.ca_tipo === 'CATEGORIA_PRODUTO').map(item => item.an_descr))
  const categoriasServico = computed(() => cadastrosAuxiliares.value.filter(item => item.ca_tipo === 'CATEGORIA_SERVICO').map(item => item.an_descr))
  const marcasProduto = computed(() => cadastrosAuxiliares.value.filter(item => item.ca_tipo === 'MARCA').map(item => item.an_descr))
  const unidadesProduto = computed(() => cadastrosAuxiliares.value.filter(item => item.ca_tipo === 'UNIDADE')
    .map(item => ({ label: item.an_descr + ' (' + item.ca_sigla + ')', value: item.ca_sigla })))

  async function load() {
    const versao = versaoSessao
    const [listaProdutos, listaServicos, listaCadastros] = await Promise.all([
      catalogoService.getProdutos(), catalogoService.getServicos(), catalogoService.getCadastrosAuxiliares(),
    ])
    if (versao !== versaoSessao)
      return
    produtos.value = listaProdutos
    servicos.value = listaServicos
    cadastrosAuxiliares.value = listaCadastros.dados.cadastros
  }
  async function saveProduto(values: IManutProduto): Promise<IAdmProduto> {
    const { dados } = await catalogoService.saveProduto(values)
    const index = produtos.value.findIndex(item => item.cn_produto === dados.cn_produto)
    if (index < 0)
      produtos.value.push(dados)
    else
      produtos.value[index] = dados
    return dados
  }
  async function saveServico(values: IManutServico): Promise<IAdmServico> {
    const { dados } = await catalogoService.saveServico(values)
    const index = servicos.value.findIndex(item => item.cn_servico === dados.cn_servico)
    if (index < 0)
      servicos.value.push(dados)
    else
      servicos.value[index] = dados
    return dados
  }
  async function saveCadastroAuxiliar(values: IManutCadastroAuxiliar): Promise<IAdmCadastroAuxiliar> {
    const { dados } = await catalogoService.saveCadastroAuxiliar(values)
    cadastrosAuxiliares.value.push(dados)
    return dados
  }
  watch(() => utilStore.user?.cn_usuario, () => {
    versaoSessao++
    produtos.value = []
    servicos.value = []
    cadastrosAuxiliares.value = []
  }, { flush: 'sync' })
  return {
    produtos,
    servicos,
    cadastrosAuxiliares,
    categoriasProduto,
    categoriasServico,
    marcasProduto,
    unidadesProduto,
    load,
    saveProduto,
    saveServico,
    saveCadastroAuxiliar
  }
})
