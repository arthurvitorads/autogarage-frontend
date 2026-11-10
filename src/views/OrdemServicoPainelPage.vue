<script setup lang="ts">
import { usePesquisa as useSearch } from '@/composables/usePesquisa'
import { getOrdersPage } from '@/services/ordem-api.service'
import { usePageLoad } from '@/composables/usePageLoad'
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import Select from 'primevue/select'
import FiltroData from '@/components/field/FiltroData.vue'
import { currentMonthDates, dateInterval } from '@/services/date-range.service'
import MovimentarOrdemServicoDialog from '@/components/dialogs/MovimentarOrdemServicoDialog.vue'
import DetalhesOrdemServicoDialog from '@/components/dialogs/DetalhesOrdemServicoDialog.vue'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'

import ManutOrdemServicoDialog from '@/components/dialogs/ManutOrdemServicoDialog.vue'
import ClassificacaoOrdemServicoDialog from '@/components/dialogs/ClassificacaoOrdemServicoDialog.vue'

import type {
  IAdmOrdemServico,
  TServiceOrderCode,
} from '@/interface/interface-pages/OrdemServicoPage'

import {
  calcularTotalOrdem as calculateOrderTotal,
  corTextoStatus as statusTextColor,
  formatCurrencyOrdem as formatOrderCurrency,
  statusOrdens as orderStatuses,
  getStatusOrdem as getOrderStatus,
  ordemEncerrada as isOrderClosed,
} from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'
import { useUtilStore } from '@/stores/util.store'

const router = useRouter()
const { canRead, canWrite } = useUtilStore()
const { inicio: start, fim: end, status } = router.options.history.state
const dates = ref<(Date | null)[]>(currentMonthDates())
if (typeof start === 'string' && typeof end === 'string') {
  const inicio = new Date(start)
  const fim = new Date(end)
  if (Number.isFinite(inicio.getTime()) && Number.isFinite(fim.getTime()) && inicio <= fim)
    dates.value = [inicio, fim]
}
const statusFilter = ref(typeof status === 'string' ? status : '')
const classificationFilter = ref<string | number | null>(null)
function orderFilters() {
  return {
    ...dateInterval(dates.value),
    ...(statusFilter.value ? { status: statusFilter.value } : {}),
    ...(classificationFilter.value ? { classificacao: String(classificationFilter.value) } : {}),
  }
}
watch(
  [dates, statusFilter, classificationFilter],
  () => {
    if (dateInterval(dates.value)) search()
  },
  { deep: true },
)
const { classificacoes: classifications } = storeToRefs(useServiceOrderStore())
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

const manutOrderVisible = ref(false)
const classificationDialogVisible = ref(false)
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
  router.push({ name: 'ordem-servico-detalhe', params: { id: order.cn_ordem_servico } })
}

function getClassification(code: TServiceOrderCode) {
  return classifications.value.find((item) => String(item.cn_classificacao) === String(code))
}

usePageLoad(async () => {
  await useServiceOrderStore().loadParametros()
  await load()
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
        <Button
          v-if="canRead('CADASTROS')"
          label="Classificações"
          icon="pi pi-cog"
          severity="secondary"
          @click="classificationDialogVisible = true"
        />
        <Button
          v-if="canWrite('ORDEM_SERVICO')"
          label="Nova O.S."
          icon="pi pi-plus"
          @click="newOrder"
        />
      </div>
    </div>
    <div class="flex flex-wrap items-end gap-3">
      <FiltroData v-model="dates" :disabled="loadingGrid" />
      <Select
        v-model="statusFilter"
        :options="orderStatuses"
        optionLabel="label"
        optionValue="value"
        placeholder="Todos os status"
        showClear
        :disabled="loadingGrid"
        aria-label="Filtrar status"
      />
      <Select
        v-model="classificationFilter"
        :options="classifications"
        optionLabel="an_descr"
        optionValue="cn_classificacao"
        placeholder="Todas as classificações"
        showClear
        :disabled="loadingGrid"
        aria-label="Filtrar classificação"
      />
      <div class="flex gap-2 flex-1 min-w-64">
        <InputText
          v-model="filter"
          placeholder="Pesquisar por número, cliente ou veículo..."
          aria-label="Pesquisar ordens no painel"
          class="flex-1 min-w-0"
          @keyup.enter="search"
        />
        <Button
          icon="pi pi-search"
          aria-label="Pesquisar"
          :disabled="loadingGrid"
          @click="search"
        />
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      <article
        v-for="order in orders"
        :key="order.cn_ordem_servico"
        class="flex flex-col gap-4 rounded-xl border border-surface-200 border-l-4 bg-white p-5 text-left cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        :style="{ borderLeftColor: getOrderStatus(order.ca_status).cor ?? '#64748b' }"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <span class="font-semibold text-surface-500"
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
          {{ getClassification(order.cn_classificacao)?.an_descr || 'Sem classificação' }}
        </p>
        <div class="min-w-0">
          <p class="text-2xl font-bold tracking-wide">{{ order.veiculo.an_placa }}</p>
          <p
            class="text-surface-600 mt-1 truncate"
            :title="order.veiculo.an_marca + ' ' + order.veiculo.an_modelo"
          >
            {{ order.veiculo.an_marca }} {{ order.veiculo.an_modelo }}
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
            aria-label="Editar O.S."
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
  <ClassificacaoOrdemServicoDialog v-model:visible="classificationDialogVisible" />
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
