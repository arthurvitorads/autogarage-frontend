<script setup lang="ts">
import { useUtilStore } from '@/stores/util.store'
import { usePesquisa as useSearch } from '@/composables/usePesquisa'
import { getOrdensPagina as getOrdersPage } from '@/services/ordem-api.service'
import { usePageLoad } from '@/composables/usePageLoad'
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

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
  getStatusOrdem as getOrderStatus,
  ordemEncerrada as isOrderClosed,
} from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'

const router = useRouter()
const { classificacoes: classifications } = storeToRefs(useServiceOrderStore())
const {
  registros: orders,
  total,
  primeiroRegistro: firstRecord,
  limite: limit,
  filtro: filter,
  loadingGrid,
  load,
  search,
  changePage,
} = useSearch<IAdmOrdemServico>(getOrdersPage)

const manutOrderVisible = ref(false)
const classificationDialogVisible = ref(false)
const selectOrder = ref<IAdmOrdemServico | null>(null)

function newOrder() {
  selectOrder.value = null
  manutOrderVisible.value = true
}

function editOrder(order: IAdmOrdemServico) {
  selectOrder.value = order
  manutOrderVisible.value = true
}

function openOrder(order: IAdmOrdemServico) {
  router.push({ name: 'ordem-servico-detalhe', params: { id: order.cn_ordem_servico } })
}

function getStatus(code: TServiceOrderCode) {
  return classifications.value.find((item) => item.cn_classificacao === code)
}

usePageLoad(async () => {
  await useServiceOrderStore().loadParametros()
  await load()
})
const { canRead, canWrite } = useUtilStore()
</script>

<template>
  <div class="grid-page flex flex-col h-full min-h-0 min-w-0 gap-4">
    <div class="flex flex-col flex-1 min-h-0 min-w-0 border border-surface-200 rounded-xl">
      <div class="flex flex-wrap justify-between gap-3 m-5">
        <div class="flex gap-2 w-140 max-w-full">
          <InputText
            v-model="filter"
            placeholder="Pesquisar por número, cliente ou veículo..."
            aria-label="Pesquisar ordens de serviço"
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
        <div class="flex gap-2">
          <Button
            v-if="canRead('CADASTROS')"
            label="Classificações"
            icon="pi pi-cog"
            severity="secondary"
            @click="classificationDialogVisible = true"
          />
          <Button v-if="canWrite('ORDEM_SERVICO')" label="Novo" icon="pi pi-plus" @click="newOrder" />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0 mx-2">
        <DataTable
          :pt="{ emptyMessage: { class: 'hidden' } }"
          :value="orders"
          dataKey="cn_ordem_servico"
          size="small"
          stripedRows
          scrollable
          scrollHeight="flex"
          tableStyle="min-width: 65rem"
          lazy
          :loading="loadingGrid"
          :totalRecords="total"
          @page="changePage"
          paginator
          v-model:first="firstRecord"
          :rows="limit"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
          currentPageReportTemplate="Total: {totalRecords}"
        >
          <Column header="Ações" class="min-w-24">
            <template #body="{ data }">
              <div class="flex">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  v-if="canWrite('ORDEM_SERVICO') && !isOrderClosed(data)"
                  aria-label="Editar ordem de serviço"
                  v-tooltip.top="'Editar ordem'"
                  @click="editOrder(data)"
                />
                <Button
                  icon="pi pi-external-link"
                  severity="secondary"
                  text
                  rounded
                  aria-label="Abrir itens da ordem"
                  v-tooltip.top="'Produtos e serviços da ordem'"
                  @click="openOrder(data)"
                />
              </div>
            </template>
          </Column>
          <Column header="O.S.">
            <template #body="{ data }">{{ String(data.nu_numero).padStart(6, '0') }}</template>
          </Column>
          <Column field="an_cliente" header="Cliente" />
          <Column header="Placa">
            <template #body="{ data }">{{ data.veiculo.an_placa }}</template>
          </Column>
          <Column header="Veículo">
            <template #body="{ data }"
              >{{ data.veiculo.an_marca }} {{ data.veiculo.an_modelo }}</template
            >
          </Column>
          <Column header="Status">
            <template #body="{ data }">
              <span
                class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                :style="{
                  backgroundColor: getOrderStatus(data.ca_status).cor ?? '#64748b',
                  color: statusTextColor(getOrderStatus(data.ca_status).cor ?? '#64748b'),
                }"
                >{{ getOrderStatus(data.ca_status).label }}</span
              >
            </template>
          </Column>
          <Column header="Entrada">
            <template #body="{ data }">{{ formatDateTime(data.dt_entrada) }}</template>
          </Column>
          <Column header="Previsão">
            <template #body="{ data }">{{ formatDateTime(data.dt_previsao) }}</template>
          </Column>
          <Column header="Total">
            <template #body="{ data }">{{
              formatOrderCurrency(calculateOrderTotal(data.itens))
            }}</template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
  <ManutOrdemServicoDialog v-model:visible="manutOrderVisible" :order="selectOrder" @saved="load" />
  <ClassificacaoOrdemServicoDialog v-model:visible="classificationDialogVisible" />
</template>
