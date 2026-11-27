<script setup lang="ts">
import type { IAdmOrdemServico } from '@/interface/tables'
import { usePesquisa as useSearch } from '@/composables/usePesquisa'
import { getOrdersPage } from '@/services/ordem-api.service'
import { usePageLoad } from '@/composables/usePageLoad'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import MultiSelect from 'primevue/multiselect'
import FiltroData from '@/components/field/FiltroData.vue'
import { currentMonthDates, dateInterval } from '@/services/date-range.service'
import MovimentarOrdemServicoDialog from '@/components/dialogs/MovimentarOrdemServicoDialog.vue'
import DetalhesOrdemServicoDialog from '@/components/dialogs/DetalhesOrdemServicoDialog.vue'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'

import ManutOrdemServicoDialog from '@/components/dialogs/ManutOrdemServicoDialog.vue'

import type { TServiceOrderCode } from '@/interface/pages/OrdemServicoPage'

import {
  calcularTotalOrdem as calculateOrderTotal,
  corTextoStatus as statusTextColor,
  formatCurrencyOrdem as formatOrderCurrency,
  statusOrdens as orderStatuses,
  getStatusOrdem as getOrderStatus,
  ordemEncerrada as isOrderClosed,
  mascararPlaca,
} from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'
import { useUtilStore } from '@/stores/util.store'

const router = useRouter()
const { canWrite, setLoading } = useUtilStore()
const { inicio: start, fim: end, status } = router.options.history.state
const dates = ref<(Date | null)[]>(currentMonthDates())
if (typeof start === 'string' && typeof end === 'string') {
  const inicio = new Date(start)
  const fim = new Date(end)
  if (Number.isFinite(inicio.getTime()) && Number.isFinite(fim.getTime()) && inicio <= fim)
    dates.value = [inicio, fim]
}
const filtrosAbertos = ref(false)
const criarFiltros = () => ({
  status: [] as string[],
  classificacao: [] as TServiceOrderCode[],
  marca: [] as string[],
  modelo: [] as string[],
})
const filtros = ref({
  ...criarFiltros(),
  status: typeof status === 'string' && status ? [status] : [],
})
const filtrosPesquisa = ref({ ...filtros.value })
const ordemStore = useServiceOrderStore()
const { classificacoes: classifications, catalogoVeiculos } = storeToRefs(ordemStore)
const marcasVeiculo = computed(() => catalogoVeiculos.value.map((marca) => marca.an_marca))
const modelosVeiculo = computed(() => {
  const marcas = filtros.value.marca.length
    ? catalogoVeiculos.value.filter((marca) => filtros.value.marca.includes(marca.an_marca))
    : catalogoVeiculos.value
  return [
    ...new Set(marcas.flatMap((marca) => marca.modelos.map((modelo) => modelo.an_descr))),
  ].sort((a, b) => a.localeCompare(b))
})

function filtrarMarca(marcas: string[] | null) {
  filtros.value.marca = marcas ?? []
  filtros.value.modelo = filtros.value.modelo.filter((modelo) =>
    modelosVeiculo.value.includes(modelo),
  )
}

function limparFiltros() {
  filtros.value = criarFiltros()
}

function orderFilters() {
  return {
    ...dateInterval(dates.value),
    ...(filtrosPesquisa.value.status.length ? { status: filtrosPesquisa.value.status } : {}),
    ...(filtrosPesquisa.value.classificacao.length
      ? { classificacao: filtrosPesquisa.value.classificacao.map(String) }
      : {}),
    ...(filtrosPesquisa.value.marca.length ? { an_marca: filtrosPesquisa.value.marca } : {}),
    ...(filtrosPesquisa.value.modelo.length ? { an_modelo: filtrosPesquisa.value.modelo } : {}),
  }
}
watch(dates, () => {
  if (dateInterval(dates.value)) search()
})
const {
  records: orders,
  total,
  firstRecord,
  limit,
  filter,
  loadingGrid,
  load,
  search,
  changePage,
} = useSearch<IAdmOrdemServico>((page, limit, search) =>
  getOrdersPage(page, limit, search, orderFilters()),
)

async function pesquisar() {
  if (loadingGrid.value) return
  filtrosPesquisa.value = { ...filtros.value }
  setLoading(true)
  try {
    await search()
  } finally {
    setLoading(false)
  }
}

const manutOrderVisible = ref(false)
const selectOrder = ref<IAdmOrdemServico | null>(null)
const movementOrder = ref<IAdmOrdemServico | null>(null)
const orderMovementVisible = ref(false)
const detailOrder = ref<IAdmOrdemServico | null>(null)
const orderDetailsVisible = ref(false)

function newOrder() {
  selectOrder.value = null
  manutOrderVisible.value = true
}

function editOrder(order: IAdmOrdemServico) {
  selectOrder.value = order
  manutOrderVisible.value = true
}

function startOrder(order: IAdmOrdemServico) {
  movementOrder.value = order
  orderMovementVisible.value = true
}

function openOrder(order: IAdmOrdemServico) {
  if (isOrderClosed(order)) {
    detailOrder.value = order
    orderDetailsVisible.value = true
    return
  }
  router.push({ name: 'ordem-servico-detalhe', params: { id: order.cn_ordem } })
}

function getClassification(code: TServiceOrderCode) {
  return classifications.value.find((item) => String(item.cn_classificacao_os) === String(code))
}

usePageLoad(async () => {
  await ordemStore.loadParametros()
  await Promise.all([load(), ordemStore.carregarCatalogoVeiculos()])
})
function updateSale(sale: { cn_venda: string }) {
  if (detailOrder.value) detailOrder.value.cn_venda = sale.cn_venda
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Painel de ordens de serviço</h1>
        <p class="text-surface-500 mt-1">{{ total }} ordem(ns)</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button v-if="canWrite('ORDEM_SERVICO')" label="Novo" icon="pi pi-plus" @click="newOrder" />
      </div>
    </div>
    <div class="flex w-full flex-wrap items-end gap-2 lg:w-1/2">
      <InputText
        v-model="filter"
        placeholder="Pesquisar por número, cliente ou veículo..."
        aria-label="Pesquisar ordens no painel"
        class="min-w-48 flex-1"
        @keyup.enter="pesquisar"
      />
      <FiltroData v-model="dates" :disabled="loadingGrid" />
      <Button
        label="Filtros"
        severity="secondary"
        outlined
        icon="pi pi-sliders-h"
        :aria-expanded="filtrosAbertos"
        aria-controls="os-filtros"
        @click="filtrosAbertos = !filtrosAbertos"
      >
        <span class="pi pi-sliders-h" aria-hidden="true" />
        <span>Filtros</span>
        <span
          :class="filtrosAbertos ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
          aria-hidden="true"
        />
      </Button>
      <Button
        icon="pi pi-search"
        aria-label="Pesquisar"
        :disabled="loadingGrid"
        @click="pesquisar"
      />
    </div>
    <div
      v-show="filtrosAbertos"
      id="os-filtros"
      class="w-full rounded-lg border border-surface-200 p-3 lg:w-1/2"
    >
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-1">
          <label for="os-filtro-status" class="text-sm font-medium">Status</label>
          <MultiSelect
            inputId="os-filtro-status"
            :disabled="loadingGrid"
            v-model="filtros.status"
            :options="orderStatuses"
            optionLabel="label"
            optionValue="value"
            :maxSelectedLabels="2"
            selectedItemsLabel="{0} selecionados"
            filter
            showClear
            fluid
          />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <label for="os-filtro-classificacao" class="text-sm font-medium">Classificação</label>
          <MultiSelect
            inputId="os-filtro-classificacao"
            :disabled="loadingGrid"
            v-model="filtros.classificacao"
            :options="classifications"
            optionLabel="an_descr"
            optionValue="cn_classificacao_os"
            :maxSelectedLabels="2"
            selectedItemsLabel="{0} selecionados"
            filter
            showClear
            fluid
          />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <label for="os-filtro-marca" class="text-sm font-medium">Marca</label>
          <MultiSelect
            inputId="os-filtro-marca"
            :disabled="loadingGrid"
            :modelValue="filtros.marca"
            @update:modelValue="filtrarMarca"
            :options="marcasVeiculo"
            :maxSelectedLabels="2"
            selectedItemsLabel="{0} selecionados"
            filter
            showClear
            fluid
          />
        </div>
        <div class="flex min-w-0 flex-col gap-1">
          <label for="os-filtro-modelo" class="text-sm font-medium">Modelo</label>
          <MultiSelect
            inputId="os-filtro-modelo"
            :disabled="loadingGrid"
            v-model="filtros.modelo"
            :options="modelosVeiculo"
            :maxSelectedLabels="2"
            selectedItemsLabel="{0} selecionados"
            filter
            showClear
            fluid
          />
        </div>
      </div>
      <div class="mt-3 flex flex-wrap justify-end gap-2">
        <Button
          label="Limpar filtros"
          severity="secondary"
          outlined
          :disabled="loadingGrid"
          @click="limparFiltros"
        />
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      <article
        v-for="order in orders"
        :key="order.cn_ordem"
        class="flex flex-col gap-4 rounded-xl border border-surface-200 border-l-4 bg-white p-5 text-left cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        :style="{ borderLeftColor: getOrderStatus(order.ca_status).cor ?? '#64748b' }"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <span class="text-sm font-semibold text-surface-500"
            >O.S. #{{ String(order.nu_numero).padStart(6, '0') }}</span
          >
          <span
            class="max-w-full rounded-full px-3 py-1 text-xs font-semibold break-words"
            :style="{
              backgroundColor: getOrderStatus(order.ca_status).cor ?? '#64748b',
              color: statusTextColor(getOrderStatus(order.ca_status).cor ?? '#64748b'),
            }"
            >{{ getOrderStatus(order.ca_status).label }}</span
          >
        </div>
        <p class="text-sm text-surface-500">
          {{ getClassification(order.cn_classificacao_os)?.an_descr || 'Sem classificação' }}
        </p>
        <div class="min-w-0">
          <p class="text-2xl font-bold tracking-wide">{{ mascararPlaca(order.an_placa) }}</p>
          <p class="text-surface-600 mt-1 truncate" :title="order.an_marca + ' ' + order.an_modelo">
            {{ order.an_marca }} {{ order.an_modelo }}
          </p>
        </div>
        <p class="font-semibold truncate" :title="order.an_cliente">
          <i class="pi pi-user mr-2 text-surface-400" aria-hidden="true"></i>
          {{ order.an_cliente }}
        </p>
        <div class="grid grid-cols-2 gap-3 text-sm rounded-lg bg-surface-50 p-3">
          <div>
            <p class="text-surface-500 mb-1">Entrada</p>
            <p>{{ formatDateTime(order.dt_entrada) }}</p>
          </div>
          <div>
            <p class="text-surface-500 mb-1">Previsão</p>
            <p>{{ formatDateTime(order.dt_previsao) }}</p>
          </div>
        </div>
        <div
          class="flex justify-between items-center gap-2 mt-auto border-t border-surface-100 pt-3"
        >
          <span class="text-surface-500 text-sm">{{ order.itens.length }} item(ns)</span>
          <span class="font-bold text-lg">{{
            formatOrderCurrency(calculateOrderTotal(order.itens))
          }}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button
            label="Detalhes"
            icon="pi pi-eye"
            severity="secondary"
            @click="openOrder(order)"
          />
          <Button
            v-if="canWrite('ORDEM_SERVICO') && !isOrderClosed(order)"
            icon="pi pi-pencil"
            severity="secondary"
            aria-label="Editar"
            @click="editOrder(order)"
          />
          <Button
            v-if="canWrite('ORDEM_SERVICO') && order.ca_status === 'ABERTO'"
            label="Iniciar serviço"
            icon="pi pi-play"
            @click="startOrder(order)"
          />
        </div>
      </article>
    </div>
    <Paginator
      v-if="total > limit"
      :first="firstRecord"
      :rows="limit"
      :totalRecords="total"
      template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
      currentPageReportTemplate="Total: {totalRecords}"
      @page="changePage"
    />
  </div>
  <ManutOrdemServicoDialog v-model:visible="manutOrderVisible" :order="selectOrder" @saved="load" />
  <MovimentarOrdemServicoDialog
    v-model:visible="orderMovementVisible"
    :order="movementOrder"
    action="INICIAR"
    @saved="load"
  />
  <DetalhesOrdemServicoDialog
    v-model:visible="orderDetailsVisible"
    :order="detailOrder"
    @faturada="updateSale"
  />
</template>
