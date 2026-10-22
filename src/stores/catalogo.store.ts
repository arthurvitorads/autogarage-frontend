import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import type { IAdmProduto, IManutProduto } from '@/interface/interface-pages/ProdutoPage'
import type { IAdmServico, IManutServico } from '@/interface/interface-pages/ServicoPage'
import type { IAdmCadastroAuxiliar, IManutCadastroAuxiliar } from '@/interface/interface-pages/CadastroAuxiliar'

import { isQuantidadeValida } from '@/services/estoque.service'
import { normalizeString } from '@/services/util.service'
import { useUtilStore } from '@/stores/util.store'

// Estado temporário da sessão: não grava no navegador nem consulta a API.
export const useCatalogoStore = defineStore('catalogo', () => {
  const produtos = ref<IAdmProduto[]>([])
  const servicos = ref<IAdmServico[]>([])
  const cadastrosAuxiliares = ref<IAdmCadastroAuxiliar[]>([])
  const utilStore = useUtilStore()
  let proximoProdutoId = 1
  let proximoServicoId = 1
  let proximoCadastroId = 1

  const categoriasProduto = computed(() => cadastrosAuxiliares.value
    .filter(cadastro => cadastro.ca_tipo === 'CATEGORIA_PRODUTO').map(cadastro => cadastro.an_descr))
  const categoriasServico = computed(() => cadastrosAuxiliares.value
    .filter(cadastro => cadastro.ca_tipo === 'CATEGORIA_SERVICO').map(cadastro => cadastro.an_descr))
  const marcasProduto = computed(() => cadastrosAuxiliares.value
    .filter(cadastro => cadastro.ca_tipo === 'MARCA').map(cadastro => cadastro.an_descr))
  const unidadesProduto = computed(() => cadastrosAuxiliares.value
    .filter(cadastro => cadastro.ca_tipo === 'UNIDADE')
    .map(cadastro => ({ label: cadastro.an_descr + ' (' + cadastro.ca_sigla + ')', value: cadastro.ca_sigla })))

  function saveCadastroAuxiliar(values: IManutCadastroAuxiliar): IAdmCadastroAuxiliar {
    if (!values.an_descr.trim()) throw new Error('Informe a descrição.')

    if (!['CATEGORIA_PRODUTO', 'CATEGORIA_SERVICO', 'MARCA', 'UNIDADE'].includes(values.ca_tipo))
      throw new Error('Tipo de cadastro inválido.')

    if (values.ca_tipo === 'UNIDADE' && !/^[A-Z0-9]{1,10}$/.test(values.ca_sigla.trim().toUpperCase()))
      throw new Error('Informe uma sigla com até 10 letras ou números.')

    if (cadastrosAuxiliares.value.some(cadastro => cadastro.ca_tipo === values.ca_tipo && (
      normalizeString(cadastro.an_descr) === normalizeString(values.an_descr) ||
      (values.ca_tipo === 'UNIDADE' && cadastro.ca_sigla === values.ca_sigla.trim().toUpperCase())
    )))
      throw new Error('Este cadastro já existe.')

    const cadastro: IAdmCadastroAuxiliar = {
      cn_cadastro: proximoCadastroId++,
      ca_tipo: values.ca_tipo,
      an_descr: values.an_descr.trim(),
      ca_sigla: values.ca_tipo === 'UNIDADE' ? values.ca_sigla.trim().toUpperCase() : '',
    }

    cadastrosAuxiliares.value.push(cadastro)
    return cadastro
  }

  function saveProduto(values: IManutProduto): IAdmProduto {
    const { cn_produto, ...dados } = values

    if (!isQuantidadeValida(dados.qt_estoque))
      throw new Error('Informe uma quantidade de estoque válida, com até três casas decimais.')

    if (!isQuantidadeValida(dados.qt_estoque_min))
      throw new Error('Informe um estoque mínimo válido, com até três casas decimais.')

    if (cn_produto !== undefined) {
      const produto = produtos.value.find(produto => produto.cn_produto === cn_produto)

      if (!produto) throw new Error('Produto não encontrado.')

      Object.assign(produto, dados)
      return produto
    }

    const produto: IAdmProduto = {
      ...dados,
      cn_produto: proximoProdutoId++,
    }

    produtos.value.push(produto)
    return produto
  }

  function saveServico(values: IManutServico): IAdmServico {
    if (values.cn_servico !== undefined) {
      const servico = servicos.value.find(servico => servico.cn_servico === values.cn_servico)

      if (!servico) throw new Error('Serviço não encontrado.')

      delete servico.nu_tempo_estimado
      Object.assign(servico, values)
      return servico
    }

    const servico = { ...values, cn_servico: proximoServicoId++ }
    servicos.value.push(servico)
    return servico
  }

  watch(() => utilStore.user?.cn_usuario, () => {
    produtos.value = []
    servicos.value = []
    cadastrosAuxiliares.value = []
    proximoProdutoId = 1
    proximoServicoId = 1
    proximoCadastroId = 1
  }, { flush: 'sync' })

  return {
    produtos, servicos, cadastrosAuxiliares,
    categoriasProduto, categoriasServico, marcasProduto, unidadesProduto,
    saveProduto, saveServico, saveCadastroAuxiliar,
  }
})
