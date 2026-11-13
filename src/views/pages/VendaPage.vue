<script setup lang="ts">
import { ref, watch, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

import GridPage from '@/components/pages/GridPage.vue'
import ManutVendaDialog from '@/components/dialogs/ManutVendaDialog.vue'
import DetalhesVendaDialog from '@/components/dialogs/DetalhesVendaDialog.vue'

import type { IAdmVenda } from '@/interface/pages/VendaPage'

import { usePageLoad } from '@/composables/usePageLoad'
import { getSalesPage, getSale } from '@/services/faturamento.service'
import { useAppToast } from '@/services/toast.service'
import { formatCurrencyOrdem as formatOrderCurrency } from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'

import { useUtilStore } from '@/stores/util.store'

import VendaPageConfig from '@/config/VendaPageConfig.json'

const route = useRoute()
const grid = useTemplateRef('grid')
const filter = ref('')
const manutSaleVisible = ref(false)
const saleDetailsVisible = ref(false)
const selectSale = ref<IAdmVenda | null>(null)
const { normalizeError } = useUtilStore()
const { showError } = useAppToast()

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
    showError(normalizeError(error))
  }
}

async function onSaleSaved(sale: IAdmVenda) {
  showSale(sale)
  await grid.value?.loadGrid()
}

watch(() => route.query.venda, loadSaleDetails)
usePageLoad(async () => {
  await grid.value?.loadGrid()
  await loadSaleDetails()
})
const { canWrite } = useUtilStore()

function onGridAction({ action, data }: { action: string; data: IAdmVenda }) {
  if (action === 'details') showSale(data)
}
</script>

<template>
  <div class="grid-page flex flex-col h-full min-h-0 min-w-0 gap-4">
    <div class="flex flex-col flex-1 min-h-0 min-w-0 border border-surface-200 rounded-xl">
      <div class="flex flex-wrap justify-between items-center gap-3 m-5">
        <div>
          <h1 class="text-xl font-semibold">Faturamento — Vendas</h1>
          <p class="text-surface-500">{{ grid?.total ?? 0 }} venda(s)</p>
        </div>
        <Button v-if="canWrite('FATURAMENTO')" label="Nova venda" icon="pi pi-plus" @click="newSale" />
        <div class="flex gap-2 w-full max-w-xl">
          <InputText v-model="filter" class="flex-1 min-w-0" placeholder="Pesquisar número, cliente ou documento..."
            aria-label="Pesquisar vendas" @keyup.enter="grid?.loadGrid(filter.trim())" />
          <Button icon="pi pi-search" aria-label="Pesquisar" :disabled="grid?.loading"
            @click="grid?.loadGrid(filter.trim())" />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0 mx-2">
        <GridPage ref="grid" :fetch-page="getSalesPage" :data-key="VendaPageConfig.dataKey"
          :columns="VendaPageConfig.columns" table-min-width="58rem" :action-header="VendaPageConfig.actionHeader"
          :actions="VendaPageConfig.actions" @action="onGridAction">
          <template #cell-ca_origem="{ data }">{{
            data.ca_origem === 'DIRETA' ? 'Avulsa' : 'O.S.'
            }}</template>
          <template #cell-dt_venda="{ data }">{{ formatDateTime(data.dt_venda) }}</template>
          <template #cell-vl_total="{ data }">{{ formatOrderCurrency(data.vl_total) }}</template>
        </GridPage>
      </div>
    </div>
  </div>
  <ManutVendaDialog v-model:visible="manutSaleVisible" @saved="onSaleSaved" />
  <DetalhesVendaDialog v-model:visible="saleDetailsVisible" :sale="selectSale" />
</template>
