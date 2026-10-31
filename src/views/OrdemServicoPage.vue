<script setup lang="ts">
import { usePesquisa } from '@/composables/usePesquisa'
import { getOrdensPagina } from '@/services/ordem-api.service'
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

import type { IAdmOrdemServico, TCodigoOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'

import { calcularTotalOrdem, corTextoStatus, formatCurrencyOrdem, getStatusOrdem, ordemEncerrada } from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'

const router = useRouter()
const { classificacoes } = storeToRefs(useOrdemServicoStore())
const { registros: ordens, total, primeiroRegistro, limite, filtro, loadingGrid, load, search, changePage } = usePesquisa<IAdmOrdemServico>(getOrdensPagina)

const manutOrdemVisible = ref(false)
const statusVisible = ref(false)
const selectOrdem = ref<IAdmOrdemServico | null>(null)



function newOrdem() {
  selectOrdem.value = null
  manutOrdemVisible.value = true
}

function editOrdem(ordem: IAdmOrdemServico) {
  selectOrdem.value = ordem
  manutOrdemVisible.value = true
}

function abrirOrdem(ordem: IAdmOrdemServico) {
  router.push({ name: 'ordem-servico-detalhe', params: { id: ordem.cn_ordem_servico } })
}

function getStatus(codigo: TCodigoOrdemServico) {
  return classificacoes.value.find(item => item.cn_classificacao === codigo)
}

usePageLoad(async () => {
  await useOrdemServicoStore().loadParametros()
  await load()
})
</script>

<template>
  <div class="grid-page flex flex-col h-full min-h-0 min-w-0 gap-4">
    <div class="flex flex-col flex-1 min-h-0 min-w-0 border border-surface-200 rounded-xl">
      <div class="flex flex-wrap justify-between gap-3 m-5">
        <div class="flex gap-2 w-140 max-w-full">
          <InputText
            v-model="filtro"
            placeholder="Pesquisar por número, cliente ou veículo..."
            aria-label="Pesquisar ordens de serviço"
            class="flex-1 min-w-0"
            @keyup.enter="search"
          />
          <Button icon="pi pi-search" aria-label="Pesquisar" :disabled="loadingGrid" @click="search" />
        </div>
        <div class="flex gap-2">
          <Button label="Classificações" icon="pi pi-cog" severity="secondary" @click="statusVisible = true" />
          <Button label="Novo" icon="pi pi-plus" @click="newOrdem" />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0 mx-2">
        <DataTable
          :pt="{ emptyMessage: { class: 'hidden' } }"
          :value="ordens"
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
          v-model:first="primeiroRegistro"
          :rows="limite"
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
                  v-if="!ordemEncerrada(data)"
                  aria-label="Editar ordem de serviço"
                  v-tooltip.top="'Editar ordem'"
                  @click="editOrdem(data)"
                />
                <Button
                  icon="pi pi-external-link"
                  severity="secondary"
                  text
                  rounded
                  aria-label="Abrir itens da ordem"
                  v-tooltip.top="'Produtos e serviços da ordem'"
                  @click="abrirOrdem(data)"
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
            <template #body="{ data }">{{ data.veiculo.an_marca }} {{ data.veiculo.an_modelo }}</template>
          </Column>
          <Column header="Status">
            <template #body="{ data }">
              <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold" :style="{ backgroundColor: getStatusOrdem(data.ca_status).cor ?? '#64748b', color: corTextoStatus(getStatusOrdem(data.ca_status).cor ?? '#64748b') }">{{ getStatusOrdem(data.ca_status).label }}</span>
            </template>
          </Column>
          <Column header="Entrada">
            <template #body="{ data }">{{ formatDateTime(data.dt_entrada) }}</template>
          </Column>
          <Column header="Previsão">
            <template #body="{ data }">{{ formatDateTime(data.dt_previsao) }}</template>
          </Column>
          <Column header="Total">
            <template #body="{ data }">{{ formatCurrencyOrdem(calcularTotalOrdem(data.itens)) }}</template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
  <ManutOrdemServicoDialog v-model:visible="manutOrdemVisible" :ordem="selectOrdem" @saved="load" />
  <ClassificacaoOrdemServicoDialog v-model:visible="statusVisible" />
</template>
