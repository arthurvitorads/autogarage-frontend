import type { IAdmOrdemServico, IFormOrdemServico, TItemOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'
import type { TGenericData } from '@/interface/util'

import { isQuantidadeValida } from '@/services/estoque.service'
import { normalizeString } from '@/services/util.service'

export function filtrarOrdensServico(ordens: IAdmOrdemServico[], pesquisa: string): IAdmOrdemServico[] {
  const termo = normalizeString(pesquisa)
  const placa = normalizarPlaca(pesquisa)

  return ordens.filter(ordem => !termo || [String(ordem.nu_numero), String(ordem.nu_numero).padStart(6, '0'), ordem.an_cliente,
    ordem.veiculo.an_placa, ordem.veiculo.an_marca, ordem.veiculo.an_modelo]
    .some(valor => normalizeString(valor).includes(termo)) ||
    (!!placa && ordem.veiculo.an_placa.includes(placa)))
    .slice().sort((primeira, segunda) => segunda.nu_numero - primeira.nu_numero)
}

export function isPrecoOrdemValido(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 999_999_999.99 &&
    Math.abs(value * 100 - Math.round(value * 100)) < 0.000001
}

export function calcularTotalItemOrdem(quantidade: number, preco: number): number {
  if (!isQuantidadeValida(quantidade) || quantidade === 0)
    throw new Error('Informe uma quantidade maior que zero, com até três casas decimais.')

  if (!isPrecoOrdemValido(preco))
    throw new Error('Informe um preço válido, com até duas casas decimais.')

  const produto = Math.round(quantidade * 1000) * Math.round(preco * 100)

  if (!Number.isSafeInteger(produto))
    throw new Error('O total do item excede o limite permitido.')

  return Math.round(produto / 1000) / 100
}

export function calcularTotalOrdem(itens: TItemOrdemServico[]): number {
  const centavos = itens.reduce((total, item) => total + Math.round(item.vl_total * 100), 0)

  if (!Number.isSafeInteger(centavos)) throw new Error('O total da ordem excede o limite permitido.')

  return centavos / 100
}

export function normalizarPlaca(value: string): string {
  return value.toUpperCase().replace(/[\s-]/g, '')
}

export function dataHoraLocal(value = new Date().toISOString()): string {
  const date = new Date(value)

  if (isNaN(date.getTime())) return ''

  const pad = (numero: number) => String(numero).padStart(2, '0')
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) + ':' + pad(date.getMinutes())
}

export function validarDadosOrdem(values: IFormOrdemServico): TGenericData {
  const errors: TGenericData = {}

  if (values.cn_pessoa === null || values.cn_pessoa === '') errors.cn_pessoa = 'Selecione o cliente.'
  if (values.cn_classificacao === null) errors.cn_classificacao = 'Selecione a classificação.'

  if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(normalizarPlaca(values.an_placa)))
    errors.an_placa = 'Informe uma placa válida.'

  if (!values.an_marca.trim()) errors.an_marca = 'Campo obrigatório.'
  if (!values.an_modelo.trim()) errors.an_modelo = 'Campo obrigatório.'

  if (values.nu_ano !== null && (!Number.isInteger(values.nu_ano) || values.nu_ano < 1900 ||
    values.nu_ano > new Date().getFullYear() + 1))
    errors.nu_ano = 'Informe um ano válido.'

  if (values.qt_quilometragem !== null && (!Number.isInteger(values.qt_quilometragem) ||
    values.qt_quilometragem < 0 || values.qt_quilometragem > 9999999))
    errors.qt_quilometragem = 'Informe uma quilometragem válida.'

  const entrada = new Date(values.dt_entrada).getTime()
  const previsao = values.dt_previsao ? new Date(values.dt_previsao).getTime() : null

  if (!values.dt_entrada || !Number.isFinite(entrada)) errors.dt_entrada = 'Informe a data de entrada.'

  if (previsao !== null && (!Number.isFinite(previsao) || previsao < entrada))
    errors.dt_previsao = 'A previsão deve ser igual ou posterior à entrada.'

  return errors
}

export function corTextoStatus(cor: string): string {
  const canais = [1, 3, 5].map(posicao => parseInt(cor.slice(posicao, posicao + 2), 16) / 255)
    .map(valor => valor <= 0.04045 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4)
  const luminancia = canais[0]! * 0.2126 + canais[1]! * 0.7152 + canais[2]! * 0.0722

  return luminancia > 0.179 ? '#111827' : '#ffffff'
}

export function formatCurrencyOrdem(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const statusOrdens = [
  { value: 'ABERTO', label: 'Aberto', cor: '#2563eb' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento', cor: '#a855f7' },
  { value: 'FINALIZADO', label: 'Finalizado', cor: '#15803d' },
  { value: 'CANCELADO', label: 'Cancelado', cor: '#64748b' },
]

export function getStatusOrdem(codigo: string) {
  return statusOrdens.find(item => item.value === codigo)!
}

export function ordemEncerrada(ordem: IAdmOrdemServico) {
  return ordem.ca_status === 'FINALIZADO' || ordem.ca_status === 'CANCELADO'
}
