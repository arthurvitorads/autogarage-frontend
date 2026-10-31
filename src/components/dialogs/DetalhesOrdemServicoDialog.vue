<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import Dialog from 'primevue/dialog'
import Fieldset from 'primevue/fieldset'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { IAdmOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'
import { getStatusOrdem, calcularTotalOrdem, formatCurrencyOrdem } from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'

const props = defineProps<{ visible: boolean; ordem: IAdmOrdemServico | null }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()
const { classificacoes } = storeToRefs(useOrdemServicoStore())
const classificacao = computed(() => classificacoes.value.find(item => String(item.cn_classificacao) === String(props.ordem?.cn_classificacao)))
</script>

<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" header="Detalhes da O.S." modal :style="{ width: '76rem', maxWidth: '95vw', maxHeight: '90vh' }">
    <div v-if="ordem" class="flex flex-col gap-4">
      <h2 class="text-xl font-semibold">O.S. #{{ String(ordem.nu_numero).padStart(6, '0') }} — {{ getStatusOrdem(ordem.ca_status).label }}</h2>
      <Fieldset legend="Dados gerais">
        <dl class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><dt class="text-surface-500">Cliente</dt><dd>{{ ordem.an_cliente }}</dd></div>
          <div><dt class="text-surface-500">Classificação</dt><dd>{{ classificacao?.an_descr || '—' }}</dd></div>
          <div><dt class="text-surface-500">Responsável</dt><dd>{{ ordem.an_responsavel || '—' }}</dd></div>
          <div><dt class="text-surface-500">Entrada</dt><dd>{{ formatDateTime(ordem.dt_entrada) }}</dd></div>
          <div><dt class="text-surface-500">Previsão</dt><dd>{{ formatDateTime(ordem.dt_previsao) }}</dd></div>
          <div><dt class="text-surface-500">Início do serviço</dt><dd>{{ formatDateTime(ordem.dt_inicio) }}</dd></div>
          <div v-if="ordem.ca_status === 'FINALIZADO'"><dt class="text-surface-500">Finalização</dt><dd>{{ formatDateTime(ordem.dt_finalizacao) }}</dd></div>
        </dl>
      </Fieldset>
      <Fieldset v-if="ordem.ca_status === 'CANCELADO'" legend="Detalhes do cancelamento">
        <p class="text-surface-500 mb-2">{{ formatDateTime(ordem.dt_cancelamento) }}</p>
        <p class="whitespace-pre-wrap break-words">{{ ordem.an_motivo_cancelamento || 'Motivo não registrado na ordem antiga.' }}</p>
      </Fieldset>
      <Fieldset legend="Veículo">
        <dl class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><dt class="text-surface-500">Placa</dt><dd>{{ ordem.veiculo.an_placa }}</dd></div>
          <div><dt class="text-surface-500">Marca</dt><dd>{{ ordem.veiculo.an_marca }}</dd></div>
          <div><dt class="text-surface-500">Modelo</dt><dd>{{ ordem.veiculo.an_modelo }}</dd></div>
          <div><dt class="text-surface-500">Ano</dt><dd>{{ ordem.veiculo.nu_ano ?? '—' }}</dd></div>
          <div><dt class="text-surface-500">Cor</dt><dd>{{ ordem.veiculo.an_cor || '—' }}</dd></div>
          <div><dt class="text-surface-500">Quilometragem</dt><dd>{{ ordem.veiculo.qt_quilometragem ?? '—' }}</dd></div>
        </dl>
      </Fieldset>
      <Fieldset legend="Produtos e serviços">
        <DataTable :value="ordem.itens" rowGroupMode="subheader" groupRowsBy="ca_tipo" sortField="ca_tipo" :sortOrder="1" size="small" scrollable>
          <template #groupheader="{ data }"><strong>{{ data.ca_tipo === 'PRODUTO' ? 'Produtos' : 'Serviços' }}</strong></template>
          <Column field="an_descr" header="Descrição" />
          <Column field="ca_unidade" header="Unidade" />
          <Column header="Quantidade"><template #body="{ data }">{{ data.qt_quantidade.toLocaleString('pt-BR') }}</template></Column>
          <Column header="Unitário"><template #body="{ data }">{{ formatCurrencyOrdem(data.vl_unitario) }}</template></Column>
          <Column header="Total"><template #body="{ data }">{{ formatCurrencyOrdem(data.vl_total) }}</template></Column>
          <template #empty>Nenhum item cadastrado.</template>
        </DataTable>
        <p class="text-right font-bold mt-4">Total: {{ formatCurrencyOrdem(calcularTotalOrdem(ordem.itens)) }}</p>
      </Fieldset>
      <Fieldset legend="Observações">
        <p class="text-surface-500">Solicitação do cliente</p>
        <p class="whitespace-pre-wrap break-words mb-3">{{ ordem.an_solicitacao || '—' }}</p>
        <p class="text-surface-500">Observações internas</p>
        <p class="whitespace-pre-wrap break-words">{{ ordem.an_obs || '—' }}</p>
      </Fieldset>
    </div>
    <template #footer>
      <Button v-if="ordem?.ca_status === 'CANCELADO'" label="Reabrir O.S." icon="pi pi-replay" disabled severity="secondary" title="Disponível em uma próxima etapa" />
      <Button label="Fechar" @click="emit('update:visible', false)" />
    </template>
  </Dialog>
</template>
