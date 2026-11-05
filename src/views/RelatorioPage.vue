<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Paginator from 'primevue/paginator'
import Dialog from 'primevue/dialog'
import FiltroData from '@/components/field/FiltroData.vue'
import DetalhesVendaDialog from '@/components/dialogs/DetalhesVendaDialog.vue'
import { usePageLoad } from '@/composables/usePageLoad'
import { datasMesAtual, intervaloDatas } from '@/services/periodo.service'
import { getRelatorioTempos, getRelatorioVendas } from '@/services/faturamento.service'
import { formatTempo } from '@/services/tempo.service'
import { formatDateTime } from '@/services/util.service'
import { formatCurrencyOrdem } from '@/services/ordem-servico.service'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'
import type {
  IRelatorioTempoResponse,
  IRelatorioVendaResponse,
  IRelatorioTempo,
  IAdmVenda,
} from '@/interface/interface-pages/VendaPage'

const props = defineProps<{ tipo: 'tempos' | 'vendas' }>()
const datas = ref<(Date | null)[]>(datasMesAtual())
const ordenacao = ref('desc')
const opcoesOrdem = [
  { label: 'Mais longos primeiro', value: 'desc' },
  { label: 'Mais rápidos primeiro', value: 'asc' },
]
const tempos = ref<IRelatorioTempoResponse | null>(null)
const vendas = ref<IRelatorioVendaResponse | null>(null)
const loading = ref(false)
const primeiro = ref(0)
const intervaloVisible = ref(false)
const servicoSelecionado = ref<IRelatorioTempo | null>(null)
const vendaSelecionada = ref<IAdmVenda | null>(null)
const vendaVisible = ref(false)
const { normalizeError } = useUtilStore()
const toast = useAppToast()
const total = computed(() =>
  props.tipo === 'tempos'
    ? (tempos.value?.pagination.total ?? 0)
    : (vendas.value?.pagination.total ?? 0),
)
let consulta = 0

async function load(reset = false) {
  const periodo = intervaloDatas(datas.value)
  if (!periodo) {
    toast.warn('Informe um período válido.')
    return
  }
  if (reset) primeiro.value = 0
  const atual = ++consulta
  loading.value = true
  try {
    const page = Math.floor(primeiro.value / 20) + 1
    if (props.tipo === 'tempos') {
      const { dados } = await getRelatorioTempos(page, periodo.inicio, periodo.fim, ordenacao.value)
      if (atual === consulta) tempos.value = dados
    } else {
      const { dados } = await getRelatorioVendas(page, periodo.inicio, periodo.fim)
      if (atual === consulta) vendas.value = dados
    }
  } catch (error) {
    if (atual === consulta) {
      tempos.value = null
      vendas.value = null
      toast.error(normalizeError(error))
    }
  } finally {
    if (atual === consulta) loading.value = false
  }
}

function detalharTempo(servico: IRelatorioTempo) {
  servicoSelecionado.value = servico
  intervaloVisible.value = true
}

watch(
  () => props.tipo,
  () => {
    tempos.value = null
    vendas.value = null
    load(true)
  },
)
usePageLoad(() => load())
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-xl font-semibold">
      {{ tipo === 'tempos' ? 'Relatório de tempo dos serviços' : 'Relatório de vendas' }}
    </h1>
    <div class="flex flex-wrap gap-3 items-end">
      <FiltroData v-model="datas" :disabled="loading" />
      <Select
        v-if="tipo === 'tempos'"
        v-model="ordenacao"
        :options="opcoesOrdem"
        optionLabel="label"
        optionValue="value"
        aria-label="Ordenar serviços por tempo"
      />
      <Button
        label="Gerar relatório"
        icon="pi pi-chart-bar"
        :loading="loading"
        @click="load(true)"
      />
    </div>
    <template v-if="tipo === 'tempos'">
      <p class="text-surface-500">
        Tempo efetivamente contado por item, excluindo pausas. Considera serviços medidos de O.S.
        finalizadas no período.
      </p>
      <div v-if="tempos" class="flex flex-wrap gap-6 border border-surface-200 rounded-xl p-4">
        <p>
          Serviços: <strong>{{ tempos.resumo.qt_servicos }}</strong>
        </p>
        <p>
          Média: <strong>{{ formatTempo(tempos.resumo.qt_media_segundos) }}</strong>
        </p>
        <p>
          Menor tempo: <strong>{{ formatTempo(tempos.resumo.qt_menor_segundos) }}</strong>
        </p>
        <p>
          Maior tempo: <strong>{{ formatTempo(tempos.resumo.qt_maior_segundos) }}</strong>
        </p>
      </div>
      <DataTable
        :value="tempos?.servicos ?? []"
        :loading="loading"
        size="small"
        scrollable
        tableStyle="min-width: 56rem"
      >
        <Column header="Intervalos"
          ><template #body="{ data }"
            ><Button
              icon="pi pi-clock"
              text
              aria-label="Consultar intervalos"
              @click="detalharTempo(data)" /></template
        ></Column>
        <Column field="nu_ordem" header="O.S." /><Column field="an_descr" header="Serviço" /><Column
          field="an_cliente"
          header="Cliente"
        />
        <Column field="an_responsavel" header="Responsável" /><Column
          field="qt_quantidade"
          header="Quantidade"
        />
        <Column header="Tempo"
          ><template #body="{ data }">{{ formatTempo(data.qt_tempo_segundos) }}</template></Column
        >
        <Column header="Finalização da O.S."
          ><template #body="{ data }">{{ formatDateTime(data.dt_finalizacao) }}</template></Column
        >
        <template #empty>Nenhum serviço com tempo medido no período.</template>
      </DataTable>
    </template>
    <template v-else>
      <div v-if="vendas" class="flex gap-6 border border-surface-200 rounded-xl p-4">
        <p>
          Vendas: <strong>{{ vendas.resumo.qt_vendas }}</strong>
        </p>
        <p>
          Total: <strong>{{ formatCurrencyOrdem(vendas.resumo.vl_total) }}</strong>
        </p>
      </div>
      <DataTable
        :value="vendas?.vendas ?? []"
        :loading="loading"
        size="small"
        scrollable
        tableStyle="min-width: 45rem"
      >
        <Column header="Ações"
          ><template #body="{ data }"
            ><Button
              icon="pi pi-eye"
              text
              aria-label="Detalhar venda"
              @click="
                vendaSelecionada = data
                ,vendaVisible = true
              " /></template
        ></Column>
        <Column field="nu_numero" header="Venda" /><Column field="an_cliente" header="Cliente" />
        <Column header="Origem"
          ><template #body="{ data }">{{
            data.ca_origem === 'DIRETA' ? 'Avulsa' : 'O.S.'
          }}</template></Column
        >
        <Column header="Data"
          ><template #body="{ data }">{{ formatDateTime(data.dt_venda) }}</template></Column
        >
        <Column header="Total"
          ><template #body="{ data }">{{ formatCurrencyOrdem(data.vl_total) }}</template></Column
        >
        <template #empty>Nenhuma venda no período.</template>
      </DataTable>
    </template>
    <Paginator
      :first="primeiro"
      :rows="20"
      :totalRecords="total"
      :disabled="loading"
      @page="
        primeiro = $event.first
        ,load()
      "
    />
  </div>
  <Dialog
    v-model:visible="intervaloVisible"
    header="Intervalos do serviço"
    modal
    :style="{ width: '55rem', maxWidth: '95vw' }"
  >
    <p class="font-semibold mb-3">{{ servicoSelecionado?.an_descr }}</p>
    <DataTable :value="servicoSelecionado?.intervalos ?? []" size="small" scrollable>
      <Column header="Início"
        ><template #body="{ data }">{{ formatDateTime(data.dt_inicio) }}</template></Column
      >
      <Column header="Fim"
        ><template #body="{ data }">{{ formatDateTime(data.dt_fim) }}</template></Column
      >
      <Column header="Duração"
        ><template #body="{ data }">{{ formatTempo(data.qt_segundos) }}</template></Column
      >
      <Column field="ca_encerramento" header="Encerramento" />
    </DataTable>
  </Dialog>
  <DetalhesVendaDialog v-model:visible="vendaVisible" :venda="vendaSelecionada" />
</template>
