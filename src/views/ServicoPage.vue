<script setup lang="ts">
import { usePesquisa } from '@/composables/usePesquisa'
import { getServicosPagina } from '@/services/catalogo.service'
import { usePageLoad } from '@/composables/usePageLoad'
import { ref } from 'vue'
import { storeToRefs } from 'pinia'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ManutServicoDialog from '@/components/dialogs/ManutServicoDialog.vue'

import type { IAdmServico } from '@/interface/interface-pages/ServicoPage'


import { useCatalogoStore } from '@/stores/catalogo.store'



// paginação e filtros

// form
const { registros: servicos, total, primeiroRegistro, limite, filtro, loadingGrid, load, search, changePage } = usePesquisa<IAdmServico>(getServicosPagina)

const manutServicoVisible = ref(false)
const selectServico = ref<IAdmServico | null>(null)




function newServico() {
  selectServico.value = null
  manutServicoVisible.value = true
}

function editServico(servico: IAdmServico) {
  selectServico.value = servico
  manutServicoVisible.value = true
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
              placeholder="Pesquisar por código ou nome..."
              aria-label="Pesquisar serviços"
              class="flex-1 min-w-0"
              @keyup.enter="search"
            />
            <Button icon="pi pi-search" aria-label="Pesquisar" :disabled="loadingGrid" @click="search" />
          </div>
          <Button label="Novo" icon="pi pi-plus" @click="newServico" />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0 mx-2">
        <DataTable
          :pt="{ emptyMessage: { class: 'hidden' } }"
          :value="servicos"
          dataKey="cn_servico"
          size="small"
          stripedRows
          scrollable
          scrollHeight="flex"
          tableStyle="min-width: 50rem"
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
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                aria-label="Editar serviço"
                v-tooltip.top="'Editar serviço'"
                @click="editServico(data)"
              />
            </template>
          </Column>
          <Column field="cn_servico" header="Código" />
          <Column field="an_nome" header="Nome" />
          <Column field="an_categoria" header="Categoria" />
          <Column header="Preço">
            <template #body="{ data }">{{ formatCurrency(data.vl_preco) }}</template>
          </Column>
          <Column header="Tempo estimado">
            <template #body="{ data }">{{ data.nu_tempo_estimado ? data.nu_tempo_estimado + ' min' : '—' }}</template>
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
  <ManutServicoDialog v-model:visible="manutServicoVisible" :servico="selectServico" @saved="load" />
</template>
