import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import type { Pessoa } from '@/models/pessoa'
import type {
  IAdmOrdemServico, IClienteOrdemServico, IManutOrdemServico,
  IManutStatusOrdemServico, IStatusOrdemServico, TItemOrdemServico, TManutItemOrdemServico, TCodigoOrdemServico,
} from '@/interface/interface-pages/OrdemServicoPage'

import { calcularTotalItemOrdem, calcularTotalOrdem, normalizarPlaca, validarDadosOrdem } from '@/services/ordem-servico.service'
import { normalizeString } from '@/services/util.service'
import { useUtilStore } from '@/stores/util.store'
import { useCatalogoStore } from '@/stores/catalogo.store'

export const useOrdemServicoStore = defineStore('ordem-servico', () => {
  const ordens = ref<IAdmOrdemServico[]>([])
  const status = ref<IStatusOrdemServico[]>([])
  const clientes = ref<IClienteOrdemServico[]>([])
  const utilStore = useUtilStore()
  const catalogoStore = useCatalogoStore()
  let proximoCodigo = 1
  let proximoStatus = 1
  let proximoItem = 1

  const statusPadrao = computed(() => status.value.find(item => item.bo_padrao) ?? null)

  function codigoIgual(primeiro: TCodigoOrdemServico | undefined, segundo: TCodigoOrdemServico | undefined): boolean {
    return primeiro !== undefined && segundo !== undefined && String(primeiro) === String(segundo)
  }

  // Ponto de entrada para a futura resposta da API de pessoas.
  // O cadastro de pessoas continua apenas emitindo JSON, sem alimentar esta lista.
  function setClientes(pessoas: Pessoa[]) {
    clientes.value = pessoas.filter(pessoa => pessoa.bo_sts_reg && pessoa.bo_categ_cliente &&
      pessoa.id !== undefined && pessoa.id !== null && String(pessoa.id).trim() !== '').map(pessoa => ({
      cn_pessoa: pessoa.id!,
      an_nome: pessoa.tipo === 'PF' ? pessoa.nome : pessoa.razaoSocial,
      an_documento: pessoa.tipo === 'PF' ? pessoa.cpf : pessoa.cnpj,
      tipo: pessoa.tipo,
    }))
  }

  function saveStatus(values: IManutStatusOrdemServico): IStatusOrdemServico {
    if (!values.an_descr.trim()) throw new Error('Informe o nome do status.')
    if (!/^#[a-fA-F0-9]{6}$/.test(values.ca_cor)) throw new Error('Selecione uma cor válida.')

    if (status.value.some(item => !codigoIgual(item.cn_status, values.cn_status) &&
      normalizeString(item.an_descr) === normalizeString(values.an_descr)))
      throw new Error('Já existe um status com esse nome.')

    const existente = values.cn_status !== undefined
      ? status.value.find(item => codigoIgual(item.cn_status, values.cn_status)) : null

    if (values.cn_status !== undefined && !existente) throw new Error('Status não encontrado.')

    const padrao = values.bo_padrao

    if (padrao) status.value.forEach(item => { item.bo_padrao = false })

    if (existente) {
      Object.assign(existente, values, { cn_status: existente.cn_status, an_descr: values.an_descr.trim(), bo_padrao: padrao })
      return existente
    }

    const novo: IStatusOrdemServico = {
      ...values,
      cn_status: proximoStatus++,
      an_descr: values.an_descr.trim(),
    }

    status.value.push(novo)
    return novo
  }

  function saveOrdem(values: IManutOrdemServico): IAdmOrdemServico {
    const errors = validarDadosOrdem({
      ...values,
      ...values.veiculo,
      dt_previsao: values.dt_previsao ?? '',
    })

    if (Object.keys(errors).length) throw new Error(Object.values(errors)[0])

    const cliente = clientes.value.find(item => String(item.cn_pessoa) === String(values.cn_pessoa))

    if (!cliente) throw new Error('Selecione um cliente ativo disponível para esta ordem.')
    const situacao = status.value.find(item => codigoIgual(item.cn_status, values.cn_status))

    if (!situacao) throw new Error('Selecione um status válido.')

    const dados = {
      cn_pessoa: cliente.cn_pessoa,
      cn_status: situacao.cn_status,
      dt_entrada: new Date(values.dt_entrada).toISOString(),
      dt_previsao: values.dt_previsao ? new Date(values.dt_previsao).toISOString() : null,
      an_responsavel: values.an_responsavel.trim(),
      veiculo: {
        ...values.veiculo,
        an_placa: normalizarPlaca(values.veiculo.an_placa),
        an_marca: values.veiculo.an_marca.trim(),
        an_modelo: values.veiculo.an_modelo.trim(),
        an_cor: values.veiculo.an_cor.trim(),
      },
      an_solicitacao: values.an_solicitacao.trim(),
      an_obs: values.an_obs.trim(),
      an_cliente: cliente.an_nome,
    }

    if (values.cn_ordem_servico !== undefined) {
      const ordem = ordens.value.find(item => codigoIgual(item.cn_ordem_servico, values.cn_ordem_servico))

      if (!ordem) throw new Error('Ordem de serviço não encontrada.')

      Object.assign(ordem, dados)
      return ordem
    }

    const codigo = proximoCodigo++
    const ordem: IAdmOrdemServico = {
      ...dados,
      cn_ordem_servico: codigo,
      nu_numero: codigo,
      itens: [],
    }

    ordens.value.push(ordem)
    return ordem
  }

  function saveItem(values: TManutItemOrdemServico): TItemOrdemServico {
    if (!['PRODUTO', 'SERVICO'].includes(values.ca_tipo))
      throw new Error('Selecione um tipo de item válido.')

    const ordem = ordens.value.find(item => codigoIgual(item.cn_ordem_servico, values.cn_ordem_servico))

    if (!ordem) throw new Error('Ordem de serviço não encontrada.')

    const existente = values.cn_item !== undefined ? ordem.itens.find(item => codigoIgual(item.cn_item, values.cn_item)) : null

    if (values.cn_item !== undefined && !existente) throw new Error('Item não encontrado nesta ordem.')

    const referencia = values.ca_tipo === 'PRODUTO'
      ? catalogoStore.produtos.find(produto => String(produto.cn_produto) === String(values.cn_produto) && produto.bo_sts_reg)
      : catalogoStore.servicos.find(servico => String(servico.cn_servico) === String(values.cn_servico) && servico.bo_sts_reg)

    if (!referencia) throw new Error('Selecione um produto ou serviço ativo disponível.')

    const novo: TItemOrdemServico = {
      ...values,
      cn_item: existente?.cn_item ?? proximoItem,
      an_descr: referencia.an_nome,
      ca_unidade: 'ca_unidade' in referencia ? referencia.ca_unidade : '',
      vl_total: calcularTotalItemOrdem(values.qt_quantidade, values.vl_unitario),
    }

    calcularTotalOrdem([...ordem.itens.filter(item => item.cn_item !== novo.cn_item), novo])

    if (existente) {
      const index = ordem.itens.findIndex(item => item.cn_item === existente.cn_item)
      ordem.itens[index] = novo
    } else {
      proximoItem++
      ordem.itens.push(novo)
    }

    // Não altera o catálogo nem o saldo: a baixa será responsabilidade do backend.
    return novo
  }

  function removeItem(codigoOrdem: TCodigoOrdemServico, codigoItem: TCodigoOrdemServico) {
    const ordem = ordens.value.find(item => codigoIgual(item.cn_ordem_servico, codigoOrdem))

    if (!ordem) throw new Error('Ordem de serviço não encontrada.')

    const index = ordem.itens.findIndex(item => codigoIgual(item.cn_item, codigoItem))

    if (index < 0) throw new Error('Item não encontrado nesta ordem.')

    ordem.itens.splice(index, 1)
  }

  watch(() => utilStore.user?.cn_usuario, () => {
    ordens.value = []
    status.value = []
    clientes.value = []
    proximoCodigo = 1
    proximoStatus = 1
    proximoItem = 1
  }, { flush: 'sync' })

  return { ordens, status, clientes, statusPadrao, setClientes, saveStatus, saveOrdem, saveItem, removeItem }
})
