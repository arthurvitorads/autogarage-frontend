<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

import GridPage from '@/components/pages/GridPage.vue'
import ManutOrdemServicoDialog from '@/components/dialogs/ManutOrdemServicoDialog.vue'
import ClassificacaoOrdemServicoDialog from '@/components/dialogs/ClassificacaoOrdemServicoDialog.vue'

import type { IAdmOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'

import { getOrdersPage } from '@/services/ordem-api.service'
import { usePageLoad } from '@/composables/usePageLoad'
import {
  calcularTotalOrdem as calculateOrderTotal,
  corTextoStatus as statusTextColor,
  formatCurrencyOrdem as formatOrderCurrency,
  getStatusOrdem as getOrderStatus,
  ordemEncerrada as isOrderClosed,
} from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'

import { useUtilStore } from '@/stores/util.store'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'

import OrdemServicoPageConfig from '@/config/OrdemServicoPageConfig.json'

const router = useRouter()
const grid = useTemplateRef('grid')
const filter = ref('')

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

usePageLoad(async () => {
  await useServiceOrderStore().loadParametros()
  await grid.value?.loadGrid()
})
const { canRead, canWrite } = useUtilStore()

function isActionVisible(action: string, order: IAdmOrdemServico) {
  return action !== 'edit' || (canWrite('ORDEM_SERVICO') && !isOrderClosed(order))
}

function onGridAction({ action, data }: { action: string; data: IAdmOrdemServico }) {
  if (action === 'edit') editOrder(data)
  if (action === 'open') openOrder(data)
}
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
            @keyup.enter="grid?.loadGrid(filter.trim())"
          />
          <Button
            icon="pi pi-search"
            aria-label="Pesquisar"
            :disabled="grid?.loading"
            @click="grid?.loadGrid(filter.trim())"
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
          <Button
            v-if="canWrite('ORDEM_SERVICO')"
            label="Novo"
            icon="pi pi-plus"
            @click="newOrder"
          />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0 mx-2">
        <GridPage
          ref="grid"
          :fetch-page="getOrdersPage"
          :data-key="OrdemServicoPageConfig.dataKey"
          :columns="OrdemServicoPageConfig.columns"
          table-min-width="65rem"
          :action-header="OrdemServicoPageConfig.actionHeader"
          :actions="OrdemServicoPageConfig.actions"
          @action="onGridAction"
          :is-action-visible="isActionVisible"
        >
          <template #cell-nu_numero="{ data }">{{
            String(data.nu_numero).padStart(6, '0')
          }}</template>
          <template #cell-placa="{ data }">{{ data.veiculo.an_placa }}</template>
          <template #cell-veiculo="{ data }"
            >{{ data.veiculo.an_marca }} {{ data.veiculo.an_modelo }}</template
          >
          <template #cell-ca_status="{ data }">
            <span
              class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
              :style="{
                backgroundColor: getOrderStatus(data.ca_status).cor ?? '#64748b',
                color: statusTextColor(getOrderStatus(data.ca_status).cor ?? '#64748b'),
              }"
              >{{ getOrderStatus(data.ca_status).label }}</span
            >
          </template>
          <template #cell-dt_entrada="{ data }">{{ formatDateTime(data.dt_entrada) }}</template>
          <template #cell-dt_previsao="{ data }">{{ formatDateTime(data.dt_previsao) }}</template>
          <template #cell-total="{ data }">{{
            formatOrderCurrency(calculateOrderTotal(data.itens))
          }}</template>
        </GridPage>
      </div>
    </div>
  </div>
  <ManutOrdemServicoDialog
    v-model:visible="manutOrderVisible"
    :order="selectOrder"
    @saved="grid?.loadGrid()"
  />
  <ClassificacaoOrdemServicoDialog v-model:visible="classificationDialogVisible" />
</template>
