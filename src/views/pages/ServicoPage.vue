<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

import GridPage from '@/components/pages/GridPage.vue'
import ManutServicoDialog from '@/components/dialogs/ManutServicoDialog.vue'

import type { IAdmServico } from '@/interface/pages/ServicoPage'

import { getServicesPage } from '@/services/catalogo.service'
import { usePageLoad } from '@/composables/usePageLoad'

import { useUtilStore } from '@/stores/util.store'
import { useCatalogoStore as useCatalogStore } from '@/stores/catalogo.store'

import ServicoPageConfig from '@/config/ServicoPageConfig.json'

const grid = useTemplateRef('grid')
const filter = ref('')

const manutServiceVisible = ref(false)
const selectService = ref<IAdmServico | null>(null)

function newService() {
  selectService.value = null
  manutServiceVisible.value = true
}

function editService(service: IAdmServico) {
  selectService.value = service
  manutServiceVisible.value = true
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

usePageLoad(async () => {
  await useCatalogStore().loadCadastros()
  await grid.value?.loadGrid()
})
const { canWrite } = useUtilStore()

function onGridAction({ action, data }: { action: string; data: IAdmServico }) {
  if (action === 'edit') editService(data)
}
</script>

<template>
  <div class="grid-page flex flex-col h-full min-h-0 min-w-0 gap-4">
    <div class="flex flex-col flex-1 min-h-0 min-w-0 border border-surface-200 rounded-xl">
      <div class="m-5 flex flex-col gap-3">
        <div class="flex flex-wrap justify-between gap-3">
          <div class="flex gap-2 w-140 max-w-full">
            <InputText v-model="filter" placeholder="Pesquisar por código ou nome..." aria-label="Pesquisar serviços"
              class="flex-1 min-w-0" @keyup.enter="grid?.loadGrid(filter.trim())" />
            <Button icon="pi pi-search" aria-label="Pesquisar" :disabled="grid?.loading"
              @click="grid?.loadGrid(filter.trim())" />
          </div>
          <Button v-if="canWrite('CADASTROS')" label="Novo" icon="pi pi-plus" @click="newService" />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0 mx-2">
        <GridPage ref="grid" :fetch-page="getServicesPage" :data-key="ServicoPageConfig.dataKey"
          :columns="ServicoPageConfig.columns" table-min-width="50rem" :action-header="ServicoPageConfig.actionHeader"
          :actions="canWrite('CADASTROS') ? ServicoPageConfig.actions : []" @action="onGridAction">
          <template #cell-vl_preco="{ data }">{{ formatCurrency(data.vl_preco) }}</template>
          <template #cell-nu_tempo_estimado="{ data }">{{
            data.nu_tempo_estimado ? data.nu_tempo_estimado + ' min' : ''
            }}</template>
          <template #cell-bo_sts_reg="{ data }">
            <Tag :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'" :severity="data.bo_sts_reg ? 'success' : 'danger'" />
          </template>
        </GridPage>
      </div>
    </div>
  </div>
  <ManutServicoDialog v-model:visible="manutServiceVisible" :service="selectService" @saved="grid?.loadGrid()" />
</template>
