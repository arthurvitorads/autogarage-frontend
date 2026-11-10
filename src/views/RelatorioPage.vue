<script setup lang="ts">
import type { IReportPageProps } from '@/interface/dialog'
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Paginator from 'primevue/paginator'
import Dialog from 'primevue/dialog'
import FiltroData from '@/components/field/FiltroData.vue'
import DetalhesVendaDialog from '@/components/dialogs/DetalhesVendaDialog.vue'
import { usePageLoad } from '@/composables/usePageLoad'
import { currentMonthDates, dateInterval } from '@/services/date-range.service'
import {
  getTimeReport,
  getSalesReport,
} from '@/services/faturamento.service'
import { formatTempo } from '@/services/tempo.service'
import { formatDateTime } from '@/services/util.service'
import { formatCurrencyOrdem as formatOrderCurrency } from '@/services/ordem-servico.service'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'
import type {
  ITimeReportResponse,
  ISaleReportResponse,
  ITimeReport,
  IAdmVenda,
} from '@/interface/interface-pages/VendaPage'

const props = defineProps<IReportPageProps>()
const dates = ref<(Date | null)[]>(currentMonthDates())
const sortOrder = ref('desc')
const sortOptions = [
  { label: 'Mais longos primeiro', value: 'desc' },
  { label: 'Mais rápidos primeiro', value: 'asc' },
]
const timeReport = ref<ITimeReportResponse | null>(null)
const sales = ref<ISaleReportResponse | null>(null)
const loading = ref(false)
const firstRecord = ref(0)
const intervalDialogVisible = ref(false)
const selectServiceTime = ref<ITimeReport | null>(null)
const selectSale = ref<IAdmVenda | null>(null)
const saleDialogVisible = ref(false)
const { normalizeError } = useUtilStore()
const toast = useAppToast()
const total = computed(() =>
  props.reportType === 'tempos'
    ? (timeReport.value?.pagination.total ?? 0)
    : (sales.value?.pagination.total ?? 0),
)
let requestId = 0

async function load(reset = false) {
  const period = dateInterval(dates.value)
  if (!period) {
    toast.warn('Informe um período válido.')
    return
  }
  if (reset) firstRecord.value = 0
  const currentRequest = ++requestId
  loading.value = true
  try {
    const page = Math.floor(firstRecord.value / 20) + 1
    if (props.reportType === 'tempos') {
      const result = await getTimeReport(page, period.inicio, period.fim, sortOrder.value)
      if (currentRequest === requestId) timeReport.value = result
    } else {
      const result = await getSalesReport(page, period.inicio, period.fim)
      if (currentRequest === requestId) sales.value = result
    }
  } catch (error) {
    if (currentRequest === requestId) {
      timeReport.value = null
      sales.value = null
      toast.error(normalizeError(error))
    }
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
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
    load(true)
  },
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
      <Button
        label="Gerar relatório"
        icon="pi pi-chart-bar"
        :loading="loading"
        @click="load(true)"
      />
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
      <DataTable
        :value="timeReport?.dados ?? []"
        :loading="loading"
        size="small"
        scrollable
        tableStyle="min-width: 56rem"
      >
        <Column header="Intervalos"
          ><template #body="{ data }"
            ><Button
              icon="pi pi-clock"
              text
              aria-label="Consultar intervalos"
              @click="showTimeDetails(data)" /></template
        ></Column>
        <Column field="nu_ordem" header="O.S." :bodyStyle="{ textAlign: 'end' }" /><Column field="an_descr" header="Serviço" /><Column
          field="an_cliente"
          header="Cliente"
        />
        <Column field="an_responsavel" header="Responsável" /><Column
          field="qt_quantidade"
          header="Quantidade"
        />
        <Column header="Tempo"
          ><template #body="{ data }">{{ formatTempo(data.qt_tempo_segundos) }}</template></Column
        >
        <Column header="Finalização da O.S."
          ><template #body="{ data }">{{ formatDateTime(data.dt_finalizacao) }}</template></Column
        >
        <template #empty>Nenhum serviço com tempo medido no período.</template>
      </DataTable>
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
      <DataTable
        :value="sales?.dados ?? []"
        :loading="loading"
        size="small"
        scrollable
        tableStyle="min-width: 45rem"
      >
        <Column header="Ações"
          ><template #body="{ data }"
            ><Button
              icon="pi pi-eye"
              text
              aria-label="Detalhar venda"
              @click="((selectSale = data), (saleDialogVisible = true))" /></template
        ></Column>
        <Column field="nu_numero" header="Venda" :bodyStyle="{ textAlign: 'end' }" /><Column field="an_cliente" header="Cliente" />
        <Column header="Origem"
          ><template #body="{ data }">{{
            data.ca_origem === 'DIRETA' ? 'Avulsa' : 'O.S.'
          }}</template></Column
        >
        <Column header="Data"
          ><template #body="{ data }">{{ formatDateTime(data.dt_venda) }}</template></Column
        >
        <Column header="Total" :bodyStyle="{ textAlign: 'end' }"
          ><template #body="{ data }">{{ formatOrderCurrency(data.vl_total) }}</template></Column
        >
        <template #empty>Nenhuma venda no período.</template>
      </DataTable>
    </template>
    <Paginator
      :first="firstRecord"
      :rows="20"
      :totalRecords="total"
      :disabled="loading"
      @page="((firstRecord = $event.first), load())"
    />
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
