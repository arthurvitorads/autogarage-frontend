<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'

import Button from 'primevue/button'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'

import GridPage from '@/components/pages/GridPage.vue'
import FiltroData from '@/components/field/FiltroData.vue'
import DetalhesVendaDialog from '@/components/dialogs/DetalhesVendaDialog.vue'

import type { IReportPageProps } from '@/interface/dialog'
import type {
  ITimeReportResponse,
  ISaleReportResponse,
  ITimeReport,
  IAdmVenda,
} from '@/interface/interface-pages/VendaPage'

import { usePageLoad } from '@/composables/usePageLoad'
import { currentMonthDates, dateInterval } from '@/services/date-range.service'
import { getTimeReport, getSalesReport } from '@/services/faturamento.service'
import { formatTempo } from '@/services/tempo.service'
import { formatDateTime } from '@/services/util.service'
import { formatCurrencyOrdem as formatOrderCurrency } from '@/services/ordem-servico.service'
import { useAppToast } from '@/services/toast.service'

import RelatorioTemposPageConfig from '@/config/RelatorioTemposPageConfig.json'
import RelatorioVendasPageConfig from '@/config/RelatorioVendasPageConfig.json'

const props = defineProps<IReportPageProps>()
const dates = ref<(Date | null)[]>(currentMonthDates())
const sortOrder = ref('desc')
const sortOptions = [
  { label: 'Mais longos primeiro', value: 'desc' },
  { label: 'Mais rápidos primeiro', value: 'asc' },
]
const timeReport = ref<ITimeReportResponse | null>(null)
const sales = ref<ISaleReportResponse | null>(null)
const timeGrid = useTemplateRef('timeGrid')
const salesGrid = useTemplateRef('salesGrid')
const loading = computed(() => timeGrid.value?.loading || salesGrid.value?.loading)
let period = dateInterval(dates.value)
let appliedSort = sortOrder.value
const intervalDialogVisible = ref(false)
const selectServiceTime = ref<ITimeReport | null>(null)
const selectSale = ref<IAdmVenda | null>(null)
const saleDialogVisible = ref(false)
const { showWarn } = useAppToast()
let requestId = 0

async function fetchTimes(page: number) {
  if (!period) return { dados: [], pagination: { total: 0 } }
  const request = ++requestId
  timeReport.value = null
  const result = await getTimeReport(page, period.inicio, period.fim, appliedSort)
  if (request === requestId) timeReport.value = result
  return result
}

async function fetchSales(page: number) {
  if (!period) return { dados: [], pagination: { total: 0 } }
  const request = ++requestId
  sales.value = null
  const result = await getSalesReport(page, period.inicio, period.fim)
  if (request === requestId) sales.value = result
  return result
}

async function load() {
  const nextPeriod = dateInterval(dates.value)
  if (!nextPeriod) {
    showWarn('Informe um período válido.')
    return
  }
  period = nextPeriod
  appliedSort = sortOrder.value
  await (timeGrid.value ?? salesGrid.value)?.loadGrid('')
}

function onTimeAction({ action, data }: { action: string; data: ITimeReport }) {
  if (action === 'intervals') showTimeDetails(data)
}

function onSaleAction({ action, data }: { action: string; data: IAdmVenda }) {
  if (action !== 'details') return
  selectSale.value = data
  saleDialogVisible.value = true
}

function showTimeDetails(service: ITimeReport) {
  selectServiceTime.value = service
  intervalDialogVisible.value = true
}

watch(
  () => props.reportType,
  () => {
    timeReport.value = null
    sales.value = null
    void load()
  },
  { flush: 'post' },
)
usePageLoad(() => load())
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-xl font-semibold">
      {{ reportType === 'tempos' ? 'Relatório de tempo dos serviços' : 'Relatório de vendas' }}
    </h1>
    <div class="flex flex-wrap gap-3 items-end">
      <FiltroData v-model="dates" :disabled="loading" />
      <Select
        v-if="reportType === 'tempos'"
        v-model="sortOrder"
        :options="sortOptions"
        optionLabel="label"
        optionValue="value"
        aria-label="Ordenar serviços por tempo"
      />
      <Button label="Gerar relatório" icon="pi pi-chart-bar" :loading="loading" @click="load" />
    </div>
    <template v-if="reportType === 'tempos'">
      <p class="text-surface-500">
        Tempo efetivamente contado por item, excluindo pausas. Considera serviços medidos de O.S.
        finalizadas no período.
      </p>
      <div v-if="timeReport" class="flex flex-wrap gap-6 border border-surface-200 rounded-xl p-4">
        <p>
          Serviços: <strong>{{ timeReport.resumo.qt_servicos }}</strong>
        </p>
        <p>
          Média: <strong>{{ formatTempo(timeReport.resumo.qt_media_segundos) }}</strong>
        </p>
        <p>
          Menor tempo: <strong>{{ formatTempo(timeReport.resumo.qt_menor_segundos) }}</strong>
        </p>
        <p>
          Maior tempo: <strong>{{ formatTempo(timeReport.resumo.qt_maior_segundos) }}</strong>
        </p>
      </div>
      <GridPage
        ref="timeGrid"
        :fetch-page="fetchTimes"
        :data-key="RelatorioTemposPageConfig.dataKey"
        :columns="RelatorioTemposPageConfig.columns"
        table-min-width="56rem"
        :action-header="RelatorioTemposPageConfig.actionHeader"
        :actions="RelatorioTemposPageConfig.actions"
        @action="onTimeAction"
        empty-message="Nenhum serviço com tempo medido no período."
      >
        <template #cell-qt_tempo_segundos="{ data }">{{
          formatTempo(data.qt_tempo_segundos)
        }}</template>
        <template #cell-dt_finalizacao="{ data }">{{
          formatDateTime(data.dt_finalizacao)
        }}</template>
      </GridPage>
    </template>
    <template v-else>
      <div v-if="sales" class="flex gap-6 border border-surface-200 rounded-xl p-4">
        <p>
          Vendas: <strong>{{ sales.resumo.qt_vendas }}</strong>
        </p>
        <p>
          Total: <strong>{{ formatOrderCurrency(sales.resumo.vl_total) }}</strong>
        </p>
      </div>
      <GridPage
        ref="salesGrid"
        :fetch-page="fetchSales"
        :data-key="RelatorioVendasPageConfig.dataKey"
        :columns="RelatorioVendasPageConfig.columns"
        table-min-width="45rem"
        :action-header="RelatorioVendasPageConfig.actionHeader"
        :actions="RelatorioVendasPageConfig.actions"
        @action="onSaleAction"
        empty-message="Nenhuma venda no período."
      >
        <template #cell-ca_origem="{ data }">{{
          data.ca_origem === 'DIRETA' ? 'Avulsa' : 'O.S.'
        }}</template>
        <template #cell-dt_venda="{ data }">{{ formatDateTime(data.dt_venda) }}</template>
        <template #cell-vl_total="{ data }">{{ formatOrderCurrency(data.vl_total) }}</template>
      </GridPage>
    </template>
  </div>
  <Dialog
    v-model:visible="intervalDialogVisible"
    header="Intervalos do serviço"
    modal
    :style="{ width: '55rem', maxWidth: '95vw' }"
  >
    <p class="font-semibold mb-3">{{ selectServiceTime?.an_descr }}</p>
    <DataTable :value="selectServiceTime?.intervalos ?? []" size="small" scrollable>
      <Column header="Início"
        ><template #body="{ data }">{{ formatDateTime(data.dt_inicio) }}</template></Column
      >
      <Column header="Fim"
        ><template #body="{ data }">{{ formatDateTime(data.dt_fim) }}</template></Column
      >
      <Column header="Duração"
        ><template #body="{ data }">{{ formatTempo(data.qt_segundos) }}</template></Column
      >
      <Column field="ca_encerramento" header="Encerramento" />
    </DataTable>
  </Dialog>
  <DetalhesVendaDialog v-model:visible="saleDialogVisible" :sale="selectSale" />
</template>
