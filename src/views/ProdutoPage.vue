<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

import GridPage from '@/components/pages/GridPage.vue'
import ManutProdutoDialog from '@/components/dialogs/ManutProdutoDialog.vue'

import type { IAdmProduto } from '@/interface/interface-pages/ProdutoPage'

import { getProductsPage } from '@/services/catalogo.service'
import { usePageLoad } from '@/composables/usePageLoad'

import { useUtilStore } from '@/stores/util.store'
import { useCatalogoStore as useCatalogStore } from '@/stores/catalogo.store'

import ProdutoPageConfig from '@/config/ProdutoPageConfig.json'

const grid = useTemplateRef('grid')
const filter = ref('')

const manutProductVisible = ref(false)
const selectProduct = ref<IAdmProduto | null>(null)

function newProduct() {
  selectProduct.value = null
  manutProductVisible.value = true
}

function editProduct(product: IAdmProduto) {
  selectProduct.value = product
  manutProductVisible.value = true
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

usePageLoad(async () => {
  await useCatalogStore().loadCadastros()
  await grid.value?.loadGrid()
})
const { canWrite } = useUtilStore()

function onGridAction({ action, data }: { action: string; data: IAdmProduto }) {
  if (action === 'edit') editProduct(data)
}
</script>

<template>
  <div class="grid-page flex flex-col h-full min-h-0 min-w-0 gap-4">
    <div class="flex flex-col flex-1 min-h-0 min-w-0 border border-surface-200 rounded-xl">
      <div class="m-5 flex flex-col gap-3">
        <div class="flex flex-wrap justify-between gap-3">
          <div class="flex gap-2 w-140 max-w-full">
            <InputText
              v-model="filter"
              placeholder="Pesquisar por código, nome ou referência..."
              aria-label="Pesquisar produtos"
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
          <Button v-if="canWrite('CADASTROS')" label="Novo" icon="pi pi-plus" @click="newProduct" />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0 mx-2">
        <GridPage
          ref="grid"
          :fetch-page="getProductsPage"
          :data-key="ProdutoPageConfig.dataKey"
          :columns="ProdutoPageConfig.columns"
          table-min-width="75rem"
          :action-header="ProdutoPageConfig.actionHeader"
          :actions="canWrite('CADASTROS') ? ProdutoPageConfig.actions : []"
          @action="onGridAction"
        >
          <template #cell-vl_custo="{ data }">{{ formatCurrency(data.vl_custo) }}</template>
          <template #cell-vl_venda="{ data }">{{ formatCurrency(data.vl_venda) }}</template>
          <template #cell-qt_estoque="{ data }">
            <Tag
              :value="formatQuantity(data.qt_estoque)"
              :severity="
                data.qt_estoque === 0
                  ? 'danger'
                  : data.qt_estoque_min > 0 && data.qt_estoque <= data.qt_estoque_min
                    ? 'warn'
                    : 'secondary'
              "
            />
          </template>
          <template #cell-qt_estoque_min="{ data }">{{
            formatQuantity(data.qt_estoque_min)
          }}</template>
          <template #cell-bo_sts_reg="{ data }">
            <Tag
              :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'"
              :severity="data.bo_sts_reg ? 'success' : 'danger'"
            />
          </template>
        </GridPage>
      </div>
    </div>
  </div>
  <ManutProdutoDialog
    v-model:visible="manutProductVisible"
    :product="selectProduct"
    :products="grid?.rows ?? []"
    @saved="grid?.loadGrid()"
  />
</template>
