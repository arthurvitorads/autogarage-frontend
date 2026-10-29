<script setup lang="ts">
import { usePageLoad } from '@/composables/usePageLoad'
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import ManutOrdemServicoDialog from '@/components/dialogs/ManutOrdemServicoDialog.vue'
import StatusOrdemServicoDialog from '@/components/dialogs/StatusOrdemServicoDialog.vue'

import type { IAdmOrdemServico, TCodigoOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'

import { calcularTotalOrdem, corTextoStatus, filtrarOrdensServico, formatCurrencyOrdem } from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'

const router = useRouter()
const { ordens, status } = storeToRefs(useOrdemServicoStore())
const limite = ref(20)
const primeiroRegistro = ref(0)
const filtro = ref('')
const pesquisa = ref('')
const manutOrdemVisible = ref(false)
const statusVisible = ref(false)
const selectOrdem = ref<IAdmOrdemServico | null>(null)
const ordensFiltradas = computed(() => filtrarOrdensServico(ordens.value, pesquisa.value))

function search() {
  pesquisa.value = filtro.value.trim()
  primeiroRegistro.value = 0
}

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
  return status.value.find(item => item.cn_status === codigo)
}

usePageLoad(() => useOrdemServicoStore().load())
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
          <Button icon="pi pi-search" aria-label="Pesquisar" @click="search" />
        </div>
        <div class="flex gap-2">
          <Button label="Status" icon="pi pi-cog" severity="secondary" @click="statusVisible = true" />
          <Button label="Novo" icon="pi pi-plus" @click="newOrdem" />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0 mx-2">
        <DataTable
          :pt="{ emptyMessage: { class: 'hidden' } }"
          :value="ordensFiltradas"
          dataKey="cn_ordem_servico"
          size="small"
          stripedRows
          scrollable
          scrollHeight="flex"
          tableStyle="min-width: 65rem"
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
              <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold" :style="{ backgroundColor: getStatus(data.cn_status)?.ca_cor ?? '#64748b', color: corTextoStatus(getStatus(data.cn_status)?.ca_cor ?? '#64748b') }">{{ getStatus(data.cn_status)?.an_descr ?? 'Status indisponível' }}</span>
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
  <ManutOrdemServicoDialog v-model:visible="manutOrdemVisible" :ordem="selectOrdem" />
  <StatusOrdemServicoDialog v-model:visible="statusVisible" />
</template>
