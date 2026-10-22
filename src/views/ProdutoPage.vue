<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ManutProdutoDialog from '@/components/dialogs/ManutProdutoDialog.vue'

import type { IAdmProduto } from '@/interface/interface-pages/ProdutoPage'

import { normalizeString } from '@/services/util.service'
import { useCatalogoStore } from '@/stores/catalogo.store'

const { produtos } = storeToRefs(useCatalogoStore())

// paginação e filtros
const limite = ref(20)
const primeiroRegistro = ref(0)
const filtro = ref('')
const pesquisa = ref('')

// form
const manutProdutoVisible = ref(false)
const selectProduto = ref<IAdmProduto | null>(null)

const produtosFiltrados = computed(() => produtos.value.filter(produto => {
  const termo = normalizeString(pesquisa.value)

  return !termo || [String(produto.cn_produto), produto.an_nome, produto.an_referencia]
    .some(valor => normalizeString(valor).includes(termo))
}))

function search() {
  pesquisa.value = filtro.value.trim()
  primeiroRegistro.value = 0
}


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

</script>

<template>
  <div class="flex flex-col h-full gap-4">
    <div class="flex flex-col flex-1 min-h-0 border border-surface-200 rounded-xl">
      <div class="m-5 flex flex-col gap-3">
        <div class="flex flex-wrap justify-between gap-3">
          <div class="flex gap-2 w-140 max-w-full">
            <InputText v-model="filtro" placeholder="Pesquisar por código, nome ou referência..."
              aria-label="Pesquisar produtos" class="flex-1 min-w-0" @keyup.enter="search" />
            <Button icon="pi pi-search" aria-label="Pesquisar" @click="search" />
          </div>
          <Button label="Novo" icon="pi pi-plus" @click="newProduto" />
        </div>
      </div>
      <div class="flex-1 min-h-0 mx-2">
        <DataTable :pt="{ emptyMessage: { class: 'hidden' } }" :value="produtosFiltrados" dataKey="cn_produto" size="small" stripedRows scrollable
          scrollHeight="flex" tableStyle="min-width: 75rem" paginator v-model:first="primeiroRegistro"
          :rows="limite" paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
          currentPageReportTemplate="Total: {totalRecords}">
          <Column header="Ações" class="w-5">
            <template #body="{ data }">
              <div class="flex">
                <Button icon="pi pi-pencil" severity="secondary" text rounded aria-label="Editar produto"
                  v-tooltip.top="'Editar produto'" @click="editProduto(data)" />
              </div>
            </template>
          </Column>
          <Column field="cn_produto" header="Código" />
          <Column field="an_nome" header="Nome" />
          <Column field="an_referencia" header="Referência" />
          <Column field="an_categoria" header="Categoria" />
          <Column field="an_marca" header="Marca" />
          <Column field="ca_unidade" header="Unidade" />
          <Column header="Custo"><template #body="{ data }">{{ formatCurrency(data.vl_custo) }}</template></Column>
          <Column header="Venda"><template #body="{ data }">{{ formatCurrency(data.vl_venda) }}</template></Column>
          <Column header="Estoque">
            <template #body="{ data }">
              <Tag :value="formatQuantidade(data.qt_estoque)" :severity="data.qt_estoque === 0 ? 'danger'
                : data.qt_estoque_min > 0 && data.qt_estoque <= data.qt_estoque_min ? 'warn' : 'secondary'" />
            </template>
          </Column>
          <Column header="Mínimo"><template #body="{ data }">{{ formatQuantidade(data.qt_estoque_min) }}</template></Column>
          <Column header="Status"><template #body="{ data }">
            <Tag :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'" :severity="data.bo_sts_reg ? 'success' : 'danger'" />
          </template></Column>
        </DataTable>
      </div>
    </div>
  </div>
  <ManutProdutoDialog v-model:visible="manutProdutoVisible" :produto="selectProduto" :produtos="produtos" />
</template>
