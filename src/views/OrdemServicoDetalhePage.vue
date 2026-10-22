<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import Fieldset from 'primevue/fieldset'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

import ManutOrdemServicoDialog from '@/components/dialogs/ManutOrdemServicoDialog.vue'
import ItemOrdemServicoDialog from '@/components/dialogs/ItemOrdemServicoDialog.vue'

import type { TItemOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'

import { calcularTotalOrdem, corTextoStatus, formatCurrencyOrdem } from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'

const route = useRoute()
const router = useRouter()
const ordemStore = useOrdemServicoStore()
const { ordens, status } = storeToRefs(ordemStore)
const { removeItem } = ordemStore
const { normalizeError } = useUtilStore()
const toast = useAppToast()
const codigo = computed(() => String(route.params.id))
const ordem = computed(() => ordens.value.find(item => String(item.cn_ordem_servico) === codigo.value))
const statusOrdem = computed(() => status.value.find(item => item.cn_status === ordem.value?.cn_status))
const totalProdutos = computed(() => calcularTotalOrdem(ordem.value?.itens.filter(item => item.ca_tipo === 'PRODUTO') ?? []))
const totalServicos = computed(() => calcularTotalOrdem(ordem.value?.itens.filter(item => item.ca_tipo === 'SERVICO') ?? []))
const totalOrdem = computed(() => calcularTotalOrdem(ordem.value?.itens ?? []))
const manutOrdemVisible = ref(false)
const itemVisible = ref(false)
const selectItem = ref<TItemOrdemServico | null>(null)

function voltarPainel() {
  router.push({ name: 'ordem-servico-painel' })
}

function newItem() {
  selectItem.value = null
  itemVisible.value = true
}

function editItem(item: TItemOrdemServico) {
  selectItem.value = item
  itemVisible.value = true
}

function excluirItem(item: TItemOrdemServico) {
  if (!ordem.value) return

  try {
    const dados = {
      operacao: 'REMOVER_ITEM',
      cn_ordem_servico: ordem.value.cn_ordem_servico,
      cn_item: item.cn_item,
    }

    removeItem(dados.cn_ordem_servico, dados.cn_item)
    console.log(JSON.stringify(dados, null, 2))
    toast.success('Item removido desta ordem. JSON gerado no console.')
  } catch (error) {
    toast.error(normalizeError(error))
  }
}

function formatQuantidade(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}
</script>

<template>
  <div v-if="ordem" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <Button icon="pi pi-arrow-left" severity="secondary" text aria-label="Voltar ao painel" @click="voltarPainel" />
        <div>
          <h1 class="text-xl font-semibold">O.S. #{{ String(ordem.nu_numero).padStart(6, '0') }}</h1>
          <p class="text-surface-500 mt-1">{{ ordem.an_cliente }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <span class="rounded-full px-3 py-1 font-semibold"
          :style="{ backgroundColor: statusOrdem?.ca_cor ?? '#64748b', color: corTextoStatus(statusOrdem?.ca_cor ?? '#64748b') }">
          {{ statusOrdem?.an_descr ?? 'Status indisponível' }}
        </span>
        <Button label="Editar O.S." icon="pi pi-pencil" severity="secondary" @click="manutOrdemVisible = true" />
      </div>
    </div>
    <Fieldset legend="Dados gerais">
      <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div><dt class="text-surface-500">Cliente</dt><dd class="font-semibold mt-1">{{ ordem.an_cliente }}</dd></div>
        <div><dt class="text-surface-500">Entrada</dt><dd class="mt-1">{{ formatDateTime(ordem.dt_entrada) }}</dd></div>
        <div><dt class="text-surface-500">Previsão de entrega</dt><dd class="mt-1">{{ formatDateTime(ordem.dt_previsao) }}</dd></div>
        <div><dt class="text-surface-500">Responsável</dt><dd class="mt-1">{{ ordem.an_responsavel || '—' }}</dd></div>
      </dl>
    </Fieldset>
    <Fieldset legend="Dados do veículo">
      <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div><dt class="text-surface-500">Placa</dt><dd class="font-bold mt-1">{{ ordem.veiculo.an_placa }}</dd></div>
        <div><dt class="text-surface-500">Marca</dt><dd class="mt-1">{{ ordem.veiculo.an_marca }}</dd></div>
        <div><dt class="text-surface-500">Modelo</dt><dd class="mt-1">{{ ordem.veiculo.an_modelo }}</dd></div>
        <div><dt class="text-surface-500">Ano</dt><dd class="mt-1">{{ ordem.veiculo.nu_ano ?? '—' }}</dd></div>
        <div><dt class="text-surface-500">Cor</dt><dd class="mt-1">{{ ordem.veiculo.an_cor || '—' }}</dd></div>
        <div><dt class="text-surface-500">Quilometragem</dt><dd class="mt-1">{{ ordem.veiculo.qt_quilometragem === null ? '—' : formatQuantidade(ordem.veiculo.qt_quilometragem) + ' km' }}</dd></div>
      </dl>
    </Fieldset>
    <Fieldset legend="Produtos e serviços">
      <div class="flex justify-end mb-4">
        <Button label="Adicionar item" icon="pi pi-plus" @click="newItem" />
      </div>
      <DataTable :pt="{ emptyMessage: { class: 'hidden' } }" :value="ordem.itens" dataKey="cn_item"
        size="small" stripedRows scrollable tableStyle="min-width: 55rem">
        <Column header="Ações" class="w-24">
          <template #body="{ data }">
            <div class="flex">
              <Button icon="pi pi-pencil" severity="secondary" text rounded aria-label="Editar item" @click="editItem(data)" />
              <Button icon="pi pi-trash" severity="danger" text rounded aria-label="Remover item" @click="excluirItem(data)" />
            </div>
          </template>
        </Column>
        <Column header="Tipo"><template #body="{ data }"><Tag :value="data.ca_tipo === 'PRODUTO' ? 'Produto' : 'Serviço'" severity="secondary" /></template></Column>
        <Column field="an_descr" header="Descrição" />
        <Column field="ca_unidade" header="Unidade" />
        <Column header="Quantidade"><template #body="{ data }">{{ formatQuantidade(data.qt_quantidade) }}</template></Column>
        <Column header="Preço unitário"><template #body="{ data }">{{ formatCurrencyOrdem(data.vl_unitario) }}</template></Column>
        <Column header="Total"><template #body="{ data }">{{ formatCurrencyOrdem(data.vl_total) }}</template></Column>
      </DataTable>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 border-t border-surface-200 pt-4">
        <div><p class="text-surface-500">Produtos</p><p class="text-lg font-semibold mt-1">{{ formatCurrencyOrdem(totalProdutos) }}</p></div>
        <div><p class="text-surface-500">Serviços</p><p class="text-lg font-semibold mt-1">{{ formatCurrencyOrdem(totalServicos) }}</p></div>
        <div><p class="text-surface-500">Total da ordem</p><p class="text-xl font-bold mt-1">{{ formatCurrencyOrdem(totalOrdem) }}</p></div>
      </div>
    </Fieldset>
    <Fieldset legend="Observações">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><p class="text-surface-500 mb-2">Solicitação do cliente</p><p class="whitespace-pre-wrap break-words">{{ ordem.an_solicitacao || '—' }}</p></div>
        <div><p class="text-surface-500 mb-2">Observações internas</p><p class="whitespace-pre-wrap break-words">{{ ordem.an_obs || '—' }}</p></div>
      </div>
    </Fieldset>
    <ManutOrdemServicoDialog v-model:visible="manutOrdemVisible" :ordem="ordem" />
    <ItemOrdemServicoDialog v-model:visible="itemVisible" :codigoOrdem="ordem.cn_ordem_servico" :item="selectItem" />
  </div>
  <div v-else class="flex flex-col items-start gap-4">
    <p>Esta ordem de serviço não está disponível.</p>
    <Button label="Voltar ao painel" icon="pi pi-arrow-left" severity="secondary" @click="voltarPainel" />
  </div>
</template>
