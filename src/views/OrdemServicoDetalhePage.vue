<script setup lang="ts">
import { useConfirmacao } from '@/composables/useConfirmacao'
import MovimentarOrdemServicoDialog from '@/components/dialogs/MovimentarOrdemServicoDialog.vue'
import DetalhesOrdemServicoDialog from '@/components/dialogs/DetalhesOrdemServicoDialog.vue'
import { usePageLoad } from '@/composables/usePageLoad'
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

import type { TItemOrdemServico, TAcaoOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'

import { calcularTotalOrdem, corTextoStatus, formatCurrencyOrdem, getStatusOrdem, ordemEncerrada } from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'

const route = useRoute()
const router = useRouter()
const ordemStore = useOrdemServicoStore()
const { ordens, classificacoes } = storeToRefs(ordemStore)
const { removeItem } = ordemStore
const { normalizeError } = useUtilStore()
const toast = useAppToast()
const codigo = computed(() => String(route.params.id))
const ordem = computed(() => ordens.value.find(item => String(item.cn_ordem_servico) === codigo.value))
const statusOrdem = computed(() => ordem.value ? getStatusOrdem(ordem.value.ca_status) : null)
const classificacao = computed(() => classificacoes.value.find(item => String(item.cn_classificacao) === String(ordem.value?.cn_classificacao)))
const movimentoVisible = ref(false)
const acao = ref<TAcaoOrdemServico>('FINALIZAR')
const confirmar = useConfirmacao()
function movimentar(value: TAcaoOrdemServico) {
  acao.value = value
  movimentoVisible.value = true
}
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

async function excluirItem(item: TItemOrdemServico) {
  if (!ordem.value || !await confirmar())
    return

  try {
    const dados = {
      operacao: 'REMOVER_ITEM',
      cn_ordem_servico: ordem.value.cn_ordem_servico,
      cn_item: item.cn_item,
    }

    await removeItem(dados.cn_ordem_servico, dados.cn_item)
    toast.success('Item removido com sucesso.')
  } catch (error) {
    toast.error(normalizeError(error))
  }
}

function formatQuantidade(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

usePageLoad(() => useOrdemServicoStore().load())
</script>

<template>
  <div v-if="ordem && !ordemEncerrada(ordem)" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <Button
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          aria-label="Voltar ao painel"
          @click="voltarPainel"
        />
        <div>
          <h1 class="text-xl font-semibold">O.S. #{{ String(ordem.nu_numero).padStart(6, '0') }}</h1>
          <p class="text-surface-500 mt-1">{{ ordem.an_cliente }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <span class="rounded-full px-3 py-1 font-semibold" :style="{ backgroundColor: statusOrdem?.cor ?? '#64748b', color: corTextoStatus(statusOrdem?.cor ?? '#64748b') }">{{ statusOrdem?.label ?? 'Status indisponível' }}</span>
        <Button v-if="ordem.ca_status === 'ABERTO'" label="Iniciar serviço" icon="pi pi-play" @click="movimentar('INICIAR')" />
        <Button v-if="ordem.ca_status === 'EM_ANDAMENTO'" label="Finalizar" icon="pi pi-check" @click="movimentar('FINALIZAR')" />
        <Button label="Cancelar O.S." severity="secondary" @click="movimentar('CANCELAR')" />
      </div>
    </div>
    <Fieldset legend="Dados gerais">
      <p class="mb-4 text-surface-500">Classificação: {{ classificacao?.an_descr || '—' }}</p>
      <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <dt class="text-surface-500">Cliente</dt>
          <dd class="font-semibold mt-1">{{ ordem.an_cliente }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Entrada</dt>
          <dd class="mt-1">{{ formatDateTime(ordem.dt_entrada) }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Previsão de entrega</dt>
          <dd class="mt-1">{{ formatDateTime(ordem.dt_previsao) }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Responsável</dt>
          <dd class="mt-1">{{ ordem.an_responsavel || '—' }}</dd>
        </div>
      </dl>
    </Fieldset>
    <Fieldset legend="Dados do veículo">
      <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <dt class="text-surface-500">Placa</dt>
          <dd class="font-bold mt-1">{{ ordem.veiculo.an_placa }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Marca</dt>
          <dd class="mt-1">{{ ordem.veiculo.an_marca }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Modelo</dt>
          <dd class="mt-1">{{ ordem.veiculo.an_modelo }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Ano</dt>
          <dd class="mt-1">{{ ordem.veiculo.nu_ano ?? '—' }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Cor</dt>
          <dd class="mt-1">{{ ordem.veiculo.an_cor || '—' }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Quilometragem</dt>
          <dd class="mt-1">{{ ordem.veiculo.qt_quilometragem === null ? '—' : formatQuantidade(ordem.veiculo.qt_quilometragem) + ' km' }}</dd>
        </div>
      </dl>
    </Fieldset>
    <Fieldset legend="Produtos e serviços">
      <div class="flex justify-end mb-4">
        <Button label="Adicionar" icon="pi pi-plus" @click="newItem" />
      </div>
      <DataTable
        :pt="{ emptyMessage: { class: 'hidden' } }"
        :value="ordem.itens"
        rowGroupMode="subheader"
        groupRowsBy="ca_tipo"
        sortField="ca_tipo"
        :sortOrder="1"
        dataKey="cn_item"
        size="small"
        stripedRows
        scrollable
        tableStyle="min-width: 55rem"
      >
        <template #groupheader="{ data }">
          <span class="font-semibold text-primary-600">{{ data.ca_tipo === 'PRODUTO' ? 'Produtos' : 'Serviços' }}</span>
        </template>
        <Column header="Ações" class="min-w-24">
          <template #body="{ data }">
            <div class="flex">
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                aria-label="Editar item"
                @click="editItem(data)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                aria-label="Remover item"
                @click="excluirItem(data)"
              />
            </div>
          </template>
        </Column>
        <Column header="Tipo">
          <template #body="{ data }">
            <Tag :value="data.ca_tipo === 'PRODUTO' ? 'Produto' : 'Serviço'" severity="secondary" />
          </template>
        </Column>
        <Column field="an_descr" header="Descrição" />
        <Column field="ca_unidade" header="Unidade" />
        <Column header="Quantidade">
          <template #body="{ data }">{{ formatQuantidade(data.qt_quantidade) }}</template>
        </Column>
        <Column header="Preço unitário">
          <template #body="{ data }">{{ formatCurrencyOrdem(data.vl_unitario) }}</template>
        </Column>
        <Column header="Total">
          <template #body="{ data }">{{ formatCurrencyOrdem(data.vl_total) }}</template>
        </Column>
      </DataTable>
    </Fieldset>
    <Fieldset legend="Totais">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 border-t border-surface-200 pt-4">
        <div>
          <p class="text-surface-500">Produtos</p>
          <p class="text-lg font-semibold mt-1">{{ formatCurrencyOrdem(totalProdutos) }}</p>
        </div>
        <div>
          <p class="text-surface-500">Serviços</p>
          <p class="text-lg font-semibold mt-1">{{ formatCurrencyOrdem(totalServicos) }}</p>
        </div>
        <div>
          <p class="text-surface-500">Total da ordem</p>
          <p class="text-xl font-bold mt-1">{{ formatCurrencyOrdem(totalOrdem) }}</p>
        </div>
      </div>
    </Fieldset>
    <Fieldset legend="Observações">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p class="text-surface-500 mb-2">Solicitação do cliente</p>
          <p class="whitespace-pre-wrap break-words">{{ ordem.an_solicitacao || '—' }}</p>
        </div>
        <div>
          <p class="text-surface-500 mb-2">Observações internas</p>
          <p class="whitespace-pre-wrap break-words">{{ ordem.an_obs || '—' }}</p>
        </div>
      </div>
    </Fieldset>
    <ManutOrdemServicoDialog v-model:visible="manutOrdemVisible" :ordem="ordem" />
    <ItemOrdemServicoDialog v-model:visible="itemVisible" :codigoOrdem="ordem.cn_ordem_servico" :item="selectItem" />
  </div>
  <div v-else-if="!ordem" class="flex flex-col items-start gap-4">
    <p>Esta ordem de serviço não está disponível.</p>
    <Button label="Voltar ao painel" icon="pi pi-arrow-left" severity="secondary" @click="voltarPainel" />
  </div>
  <MovimentarOrdemServicoDialog v-model:visible="movimentoVisible" :ordem="ordem ?? null" :acao="acao" />
  <DetalhesOrdemServicoDialog :visible="!!ordem && ordemEncerrada(ordem)" :ordem="ordem ?? null" @update:visible="voltarPainel" />
</template>
