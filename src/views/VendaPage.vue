<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ManutVendaDialog from '@/components/dialogs/ManutVendaDialog.vue'
import DetalhesVendaDialog from '@/components/dialogs/DetalhesVendaDialog.vue'
import { usePesquisa as useSearch } from '@/composables/usePesquisa'
import { usePageLoad } from '@/composables/usePageLoad'
import {
  getSalesPage,
  getSale,
} from '@/services/faturamento.service'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'
import { formatCurrencyOrdem as formatOrderCurrency } from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import type { IAdmVenda } from '@/interface/interface-pages/VendaPage'

const route = useRoute()
const {
  records: sales,
  total,
  firstRecord,
  limit,
  filter,
  loadingGrid,
  load,
  search,
  changePage,
} = useSearch<IAdmVenda>(getSalesPage)
const manutSaleVisible = ref(false)
const saleDetailsVisible = ref(false)
const selectSale = ref<IAdmVenda | null>(null)
const { normalizeError } = useUtilStore()
const toast = useAppToast()

function newSale() {
  selectSale.value = null
  manutSaleVisible.value = true
}

function showSale(sale: IAdmVenda) {
  selectSale.value = sale
  saleDetailsVisible.value = true
}

async function loadSaleDetails() {
  if (typeof route.query.venda !== 'string') return
  try {
    const { dados: data } = await getSale(route.query.venda)
    showSale(data)
  } catch (error) {
    toast.error(normalizeError(error))
  }
}

async function onSaleSaved(sale: IAdmVenda) {
  showSale(sale)
  await load()
}

watch(() => route.query.venda, loadSaleDetails)
usePageLoad(async () => {
  await load()
  await loadSaleDetails()
})
const { canWrite } = useUtilStore()
</script>

<template>
  <div class="grid-page flex flex-col h-full min-h-0 min-w-0 gap-4">
    <div class="flex flex-col flex-1 min-h-0 min-w-0 border border-surface-200 rounded-xl">
      <div class="flex flex-wrap justify-between items-center gap-3 m-5">
        <div>
          <h1 class="text-xl font-semibold">Faturamento — Vendas</h1>
          <p class="text-surface-500">{{ total }} venda(s)</p>
        </div>
        <Button
          v-if="canWrite('FATURAMENTO')"
          label="Nova venda"
          icon="pi pi-plus"
          @click="newSale"
        />
        <div class="flex gap-2 w-full max-w-xl">
          <InputText
            v-model="filter"
            class="flex-1 min-w-0"
            placeholder="Pesquisar número, cliente ou documento..."
            aria-label="Pesquisar vendas"
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
      <div class="flex-1 min-h-0 min-w-0 mx-2">
        <DataTable
          :value="sales"
          dataKey="cn_venda"
          size="small"
          stripedRows
          scrollable
          scrollHeight="flex"
          tableStyle="min-width: 58rem"
          lazy
          paginator
          :first="firstRecord"
          :rows="limit"
          :totalRecords="total"
          :loading="loadingGrid"
          @page="changePage"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
          currentPageReportTemplate="Total: {totalRecords}"
        >
          <Column header="Ações"
            ><template #body="{ data }"
              ><Button
                icon="pi pi-eye"
                text
                rounded
                aria-label="Detalhar venda"
                @click="showSale(data)" /></template
          ></Column>
          <Column field="nu_numero" header="Número" :bodyStyle="{ textAlign: 'end' }" /><Column
            field="an_cliente"
            header="Cliente"
          /><Column field="ca_documento" header="Documento" />
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
          <template #empty>Nenhuma venda encontrada.</template>
        </DataTable>
      </div>
    </div>
  </div>
  <ManutVendaDialog v-model:visible="manutSaleVisible" @saved="onSaleSaved" />
  <DetalhesVendaDialog v-model:visible="saleDetailsVisible" :sale="selectSale" />
</template>
