<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'

import ManutOrdemServicoDialog from '@/components/dialogs/ManutOrdemServicoDialog.vue'
import StatusOrdemServicoDialog from '@/components/dialogs/StatusOrdemServicoDialog.vue'

import type { IAdmOrdemServico, TCodigoOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'

import { calcularTotalOrdem, corTextoStatus, filtrarOrdensServico, formatCurrencyOrdem } from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'

const router = useRouter()
const { ordens, status } = storeToRefs(useOrdemServicoStore())
const filtro = ref('')
const pesquisa = ref('')
const primeiroRegistro = ref(0)
const limite = ref(20)
const manutOrdemVisible = ref(false)
const statusVisible = ref(false)
const ordensFiltradas = computed(() => filtrarOrdensServico(ordens.value, pesquisa.value))
const ordensPagina = computed(() => ordensFiltradas.value.slice(primeiroRegistro.value, primeiroRegistro.value + limite.value))

function search() {
  pesquisa.value = filtro.value.trim()
  primeiroRegistro.value = 0
}

function abrirOrdem(ordem: IAdmOrdemServico) {
  router.push({ name: 'ordem-servico-detalhe', params: { id: ordem.cn_ordem_servico } })
}

function getStatus(codigo: TCodigoOrdemServico) {
  return status.value.find(item => item.cn_status === codigo)
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Painel de ordens de serviço</h1>
        <p class="text-surface-500 mt-1">{{ ordensFiltradas.length }} ordem(ns)</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button label="Status" icon="pi pi-cog" severity="secondary" @click="statusVisible = true" />
        <Button label="Nova O.S." icon="pi pi-plus" @click="manutOrdemVisible = true" />
      </div>
    </div>
    <div class="flex gap-2 w-140 max-w-full">
      <InputText v-model="filtro" placeholder="Pesquisar por número, cliente ou veículo..."
        aria-label="Pesquisar ordens no painel" class="flex-1 min-w-0" @keyup.enter="search" />
      <Button icon="pi pi-search" aria-label="Pesquisar" @click="search" />
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      <button v-for="ordem in ordensPagina" :key="ordem.cn_ordem_servico" type="button"
        class="flex flex-col gap-4 rounded-xl border border-surface-200 border-l-4 bg-white p-5 text-left cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        :style="{ borderLeftColor: getStatus(ordem.cn_status)?.ca_cor ?? '#64748b' }"
        :aria-label="'Abrir O.S. ' + ordem.nu_numero + ', ' + ordem.an_cliente + ', placa ' + ordem.veiculo.an_placa"
        @click="abrirOrdem(ordem)">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <span class="font-semibold text-surface-500">O.S. #{{ String(ordem.nu_numero).padStart(6, '0') }}</span>
          <span class="max-w-full rounded-full px-3 py-1 text-xs font-semibold break-words"
            :style="{ backgroundColor: getStatus(ordem.cn_status)?.ca_cor ?? '#64748b', color: corTextoStatus(getStatus(ordem.cn_status)?.ca_cor ?? '#64748b') }">
            {{ getStatus(ordem.cn_status)?.an_descr ?? 'Status indisponível' }}
          </span>
        </div>
        <div class="min-w-0">
          <p class="text-2xl font-bold tracking-wide">{{ ordem.veiculo.an_placa }}</p>
          <p class="text-surface-600 mt-1 truncate" :title="ordem.veiculo.an_marca + ' ' + ordem.veiculo.an_modelo">
            {{ ordem.veiculo.an_marca }} {{ ordem.veiculo.an_modelo }}
          </p>
        </div>
        <p class="font-semibold truncate" :title="ordem.an_cliente">
          <i class="pi pi-user mr-2 text-surface-400" aria-hidden="true"></i>{{ ordem.an_cliente }}
        </p>
        <div class="grid grid-cols-2 gap-3 text-sm rounded-lg bg-surface-50 p-3">
          <div><p class="text-surface-500 mb-1">Entrada</p><p>{{ formatDateTime(ordem.dt_entrada) }}</p></div>
          <div><p class="text-surface-500 mb-1">Previsão</p><p>{{ formatDateTime(ordem.dt_previsao) }}</p></div>
        </div>
        <div class="flex justify-between items-center gap-2 mt-auto border-t border-surface-100 pt-3">
          <span class="text-surface-500 text-sm">{{ ordem.itens.length }} item(ns)</span>
          <span class="font-bold text-lg">{{ formatCurrencyOrdem(calcularTotalOrdem(ordem.itens)) }}</span>
        </div>
      </button>
    </div>
    <Paginator v-if="ordensFiltradas.length > limite" :first="primeiroRegistro" :rows="limite" :totalRecords="ordensFiltradas.length"
      template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
      currentPageReportTemplate="Total: {totalRecords}" @page="primeiroRegistro = $event.first" />
  </div>
  <ManutOrdemServicoDialog v-model:visible="manutOrdemVisible" />
  <StatusOrdemServicoDialog v-model:visible="statusVisible" />
</template>
