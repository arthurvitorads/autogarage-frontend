<script setup lang="ts">
import { usePesquisa } from '@/composables/usePesquisa'
import { getOrdensPagina } from '@/services/ordem-api.service'
import { usePageLoad } from '@/composables/usePageLoad'
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import Select from 'primevue/select'
import FiltroData from '@/components/field/FiltroData.vue'
import { datasMesAtual, intervaloDatas } from '@/services/periodo.service'
import MovimentarOrdemServicoDialog from '@/components/dialogs/MovimentarOrdemServicoDialog.vue'
import DetalhesOrdemServicoDialog from '@/components/dialogs/DetalhesOrdemServicoDialog.vue'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'

import ManutOrdemServicoDialog from '@/components/dialogs/ManutOrdemServicoDialog.vue'
import ClassificacaoOrdemServicoDialog from '@/components/dialogs/ClassificacaoOrdemServicoDialog.vue'

import type { IAdmOrdemServico, TCodigoOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'

import { calcularTotalOrdem, corTextoStatus, formatCurrencyOrdem, statusOrdens, getStatusOrdem, ordemEncerrada } from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'

const router = useRouter()
const route = useRoute()
const datas = ref<(Date | null)[]>(datasMesAtual())
if (typeof route.query.inicio === 'string' && typeof route.query.fim === 'string') {
  const inicio = new Date(route.query.inicio)
  const fim = new Date(route.query.fim)
  if (Number.isFinite(inicio.getTime()) && Number.isFinite(fim.getTime()) && inicio <= fim)
    datas.value = [inicio, fim]
}
const filtroStatus = ref(typeof route.query.status === 'string' ? route.query.status : '')
const filtroClassificacao = ref<string | number | null>(null)
function filtrosOrdem() {
  return {
    ...intervaloDatas(datas.value),
    ...(filtroStatus.value ? { status: filtroStatus.value } : {}),
    ...(filtroClassificacao.value ? { classificacao: String(filtroClassificacao.value) } : {}),
  }
}
watch([datas, filtroStatus, filtroClassificacao], () => {
  if (intervaloDatas(datas.value))
    search()
}, { deep: true })
const { classificacoes } = storeToRefs(useOrdemServicoStore())
const { registros: ordens, total, primeiroRegistro, limite, filtro, loadingGrid, load, search, changePage } = usePesquisa<IAdmOrdemServico>((page, limit, search) => getOrdensPagina(page, limit, search, filtrosOrdem()))

const manutOrdemVisible = ref(false)
const statusVisible = ref(false)
const selectOrdem = ref<IAdmOrdemServico | null>(null)
const movimentoOrdem = ref<IAdmOrdemServico | null>(null)
const movimentoVisible = ref(false)
const detalheOrdem = ref<IAdmOrdemServico | null>(null)
const detalheVisible = ref(false)

function newOrdem() {
  selectOrdem.value = null
  manutOrdemVisible.value = true
}

function editOrdem(ordem: IAdmOrdemServico) {
  selectOrdem.value = ordem
  manutOrdemVisible.value = true
}

function iniciar(ordem: IAdmOrdemServico) {
  movimentoOrdem.value = ordem
  movimentoVisible.value = true
}



function abrirOrdem(ordem: IAdmOrdemServico) {
  if (ordemEncerrada(ordem)) {
    detalheOrdem.value = ordem
    detalheVisible.value = true
    return
  }
  router.push({ name: 'ordem-servico-detalhe', params: { id: ordem.cn_ordem_servico } })
}

function getClassificacao(codigo: TCodigoOrdemServico) {
  return classificacoes.value.find(item => String(item.cn_classificacao) === String(codigo))
}

usePageLoad(async () => {
  await useOrdemServicoStore().loadParametros()
  await load()
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold">Painel de ordens de serviço</h1>
        <p class="text-surface-500 mt-1">{{ total }} ordem(ns)</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button label="Classificações" icon="pi pi-cog" severity="secondary" @click="statusVisible = true" />
        <Button label="Nova O.S." icon="pi pi-plus" @click="newOrdem" />
      </div>
    </div>
    <div class="flex flex-wrap items-end gap-3">
      <FiltroData v-model="datas" :disabled="loadingGrid" />
      <Select v-model="filtroStatus" :options="statusOrdens" optionLabel="label" optionValue="value" placeholder="Todos os status" showClear :disabled="loadingGrid" aria-label="Filtrar status" />
      <Select v-model="filtroClassificacao" :options="classificacoes" optionLabel="an_descr" optionValue="cn_classificacao" placeholder="Todas as classificações" showClear :disabled="loadingGrid" aria-label="Filtrar classificação" />
      <div class="flex gap-2 flex-1 min-w-64">
        <InputText
          v-model="filtro"
          placeholder="Pesquisar por número, cliente ou veículo..."
          aria-label="Pesquisar ordens no painel"
          class="flex-1 min-w-0"
          @keyup.enter="search"
        />
        <Button icon="pi pi-search" aria-label="Pesquisar" :disabled="loadingGrid" @click="search" />
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      <article
        v-for="ordem in ordens"
        :key="ordem.cn_ordem_servico"
        class="flex flex-col gap-4 rounded-xl border border-surface-200 border-l-4 bg-white p-5 text-left cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        :style="{ borderLeftColor: getStatusOrdem(ordem.ca_status).cor ?? '#64748b' }"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <span class="font-semibold text-surface-500">O.S. #{{ String(ordem.nu_numero).padStart(6, '0') }}</span>
          <span class="max-w-full rounded-full px-3 py-1 text-xs font-semibold break-words" :style="{ backgroundColor: getStatusOrdem(ordem.ca_status).cor ?? '#64748b', color: corTextoStatus(getStatusOrdem(ordem.ca_status).cor ?? '#64748b') }">{{ getStatusOrdem(ordem.ca_status).label }}</span>
        </div>
        <p class="text-sm text-surface-500">{{ getClassificacao(ordem.cn_classificacao)?.an_descr || 'Sem classificação' }}</p>
        <div class="min-w-0">
          <p class="text-2xl font-bold tracking-wide">{{ ordem.veiculo.an_placa }}</p>
          <p class="text-surface-600 mt-1 truncate" :title="ordem.veiculo.an_marca + ' ' + ordem.veiculo.an_modelo">{{ ordem.veiculo.an_marca }} {{ ordem.veiculo.an_modelo }}</p>
        </div>
        <p class="font-semibold truncate" :title="ordem.an_cliente">
          <i class="pi pi-user mr-2 text-surface-400" aria-hidden="true"></i>
          {{ ordem.an_cliente }}
        </p>
        <div class="grid grid-cols-2 gap-3 text-sm rounded-lg bg-surface-50 p-3">
          <div>
            <p class="text-surface-500 mb-1">Entrada</p>
            <p>{{ formatDateTime(ordem.dt_entrada) }}</p>
          </div>
          <div>
            <p class="text-surface-500 mb-1">Previsão</p>
            <p>{{ formatDateTime(ordem.dt_previsao) }}</p>
          </div>
        </div>
        <div class="flex justify-between items-center gap-2 mt-auto border-t border-surface-100 pt-3">
          <span class="text-surface-500 text-sm">{{ ordem.itens.length }} item(ns)</span>
          <span class="font-bold text-lg">{{ formatCurrencyOrdem(calcularTotalOrdem(ordem.itens)) }}</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button label="Detalhes" icon="pi pi-eye" severity="secondary" @click="abrirOrdem(ordem)" />
          <Button v-if="!ordemEncerrada(ordem)" icon="pi pi-pencil" severity="secondary" aria-label="Editar O.S." @click="editOrdem(ordem)" />
          <Button v-if="ordem.ca_status === 'ABERTO'" label="Iniciar serviço" icon="pi pi-play" @click="iniciar(ordem)" />
        </div>
      </article>
    </div>
    <Paginator
      v-if="total > limite"
      :first="primeiroRegistro"
      :rows="limite"
      :totalRecords="total"
      template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
      currentPageReportTemplate="Total: {totalRecords}"
      @page="changePage"
    />
  </div>
  <ManutOrdemServicoDialog v-model:visible="manutOrdemVisible" :ordem="selectOrdem" @saved="load" />
  <ClassificacaoOrdemServicoDialog v-model:visible="statusVisible" />
  <MovimentarOrdemServicoDialog v-model:visible="movimentoVisible" :ordem="movimentoOrdem" acao="INICIAR" @saved="load" />
  <DetalhesOrdemServicoDialog v-model:visible="detalheVisible" :ordem="detalheOrdem" />
</template>
