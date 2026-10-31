<script setup lang="ts">
import { usePesquisa } from '@/composables/usePesquisa'
import { getProdutosPagina } from '@/services/catalogo.service'
import { usePageLoad } from '@/composables/usePageLoad'
import { ref } from 'vue'
import { storeToRefs } from 'pinia'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ManutProdutoDialog from '@/components/dialogs/ManutProdutoDialog.vue'

import type { IAdmProduto } from '@/interface/interface-pages/ProdutoPage'


import { useCatalogoStore } from '@/stores/catalogo.store'



// paginação e filtros

// form
const { registros: produtos, total, primeiroRegistro, limite, filtro, loadingGrid, load, search, changePage } = usePesquisa<IAdmProduto>(getProdutosPagina)

const manutProdutoVisible = ref(false)
const selectProduto = ref<IAdmProduto | null>(null)




function newProduto() {
  selectProduto.value = null
  manutProdutoVisible.value = true
}

function editProduto(produto: IAdmProduto) {
  selectProduto.value = produto
  manutProdutoVisible.value = true
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatQuantidade(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

usePageLoad(async () => {
  await useCatalogoStore().loadCadastros()
  await load()
})
</script>

<template>
  <div class="grid-page flex flex-col h-full min-h-0 min-w-0 gap-4">
    <div class="flex flex-col flex-1 min-h-0 min-w-0 border border-surface-200 rounded-xl">
      <div class="m-5 flex flex-col gap-3">
        <div class="flex flex-wrap justify-between gap-3">
          <div class="flex gap-2 w-140 max-w-full">
            <InputText
              v-model="filtro"
              placeholder="Pesquisar por código, nome ou referência..."
              aria-label="Pesquisar produtos"
              class="flex-1 min-w-0"
              @keyup.enter="search"
            />
            <Button icon="pi pi-search" aria-label="Pesquisar" :disabled="loadingGrid" @click="search" />
          </div>
          <Button label="Novo" icon="pi pi-plus" @click="newProduto" />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0 mx-2">
        <DataTable
          :pt="{ emptyMessage: { class: 'hidden' } }"
          :value="produtos"
          dataKey="cn_produto"
          size="small"
          stripedRows
          scrollable
          scrollHeight="flex"
          tableStyle="min-width: 75rem"
          lazy
          :loading="loadingGrid"
          :totalRecords="total"
          @page="changePage"
          paginator
          v-model:first="primeiroRegistro"
          :rows="limite"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
          currentPageReportTemplate="Total: {totalRecords}"
        >
          <Column header="Ações" class="min-w-5">
            <template #body="{ data }">
              <div class="flex">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  aria-label="Editar produto"
                  v-tooltip.top="'Editar produto'"
                  @click="editProduto(data)"
                />
              </div>
            </template>
          </Column>
          <Column field="cn_produto" header="Código" />
          <Column field="an_nome" header="Nome" />
          <Column field="an_referencia" header="Referência" />
          <Column field="an_categoria" header="Categoria" />
          <Column field="an_marca" header="Marca" />
          <Column field="ca_unidade" header="Unidade" />
          <Column header="Custo">
            <template #body="{ data }">{{ formatCurrency(data.vl_custo) }}</template>
          </Column>
          <Column header="Venda">
            <template #body="{ data }">{{ formatCurrency(data.vl_venda) }}</template>
          </Column>
          <Column header="Estoque">
            <template #body="{ data }">
              <Tag
                :value="formatQuantidade(data.qt_estoque)"
                :severity="data.qt_estoque === 0 ? 'danger'
                : data.qt_estoque_min > 0 && data.qt_estoque <= data.qt_estoque_min ? 'warn' : 'secondary'"
              />
            </template>
          </Column>
          <Column header="Mínimo">
            <template #body="{ data }">{{ formatQuantidade(data.qt_estoque_min) }}</template>
          </Column>
          <Column header="Status">
            <template #body="{ data }">
              <Tag :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'" :severity="data.bo_sts_reg ? 'success' : 'danger'" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
  <ManutProdutoDialog v-model:visible="manutProdutoVisible" :produto="selectProduto" :produtos="produtos" @saved="load" />
</template>
