<script setup lang="ts">
import TempoServicoItem from '@/components/field/TempoServicoItem.vue'
import { useConfirmacao as useConfirmation } from '@/composables/useConfirmacao'
import MovimentarOrdemServicoDialog from '@/components/dialogs/MovimentarOrdemServicoDialog.vue'
import DetalhesOrdemServicoDialog from '@/components/dialogs/DetalhesOrdemServicoDialog.vue'
import { usePageLoad } from '@/composables/usePageLoad'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

import Fieldset from 'primevue/fieldset'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

import ManutOrdemServicoDialog from '@/components/dialogs/ManutOrdemServicoDialog.vue'
import ItemOrdemServicoDialog from '@/components/dialogs/ItemOrdemServicoDialog.vue'

import type {
  TItemOrdemServico,
  TServiceOrderAction,
} from '@/interface/interface-pages/OrdemServicoPage'

import {
  calcularTotalOrdem as calculateOrderTotal,
  corTextoStatus as statusTextColor,
  formatCurrencyOrdem as formatOrderCurrency,
  getStatusOrdem as getOrderStatus,
  ordemEncerrada as isOrderClosed,
} from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'

const route = useRoute()
const router = useRouter()
const orderStore = useServiceOrderStore()
const { ordens: orders, classificacoes: classifications } = storeToRefs(orderStore)
const { removeItem } = orderStore
const { normalizeError, canWrite } = useUtilStore()
const toast = useAppToast()
const code = computed(() => String(route.params.id))
const order = computed(() =>
  orders.value.find((item) => String(item.cn_ordem_servico) === code.value),
)
const orderStatus = computed(() => (order.value ? getOrderStatus(order.value.ca_status) : null))
const classification = computed(() =>
  classifications.value.find(
    (item) => String(item.cn_classificacao) === String(order.value?.cn_classificacao),
  ),
)
const orderMovementVisible = ref(false)
const action = ref<TServiceOrderAction>('FINALIZAR')
const confirmAction = useConfirmation()
function moveOrder(value: TServiceOrderAction) {
  action.value = value
  orderMovementVisible.value = true
}
const productsTotal = computed(() =>
  calculateOrderTotal(order.value?.itens.filter((item) => item.ca_tipo === 'PRODUTO') ?? []),
)
const servicesTotal = computed(() =>
  calculateOrderTotal(order.value?.itens.filter((item) => item.ca_tipo === 'SERVICO') ?? []),
)
const orderTotal = computed(() => calculateOrderTotal(order.value?.itens ?? []))
const manutOrderVisible = ref(false)
const itemDialogVisible = ref(false)
const selectItem = ref<TItemOrdemServico | null>(null)

function backToPanel() {
  router.push({ name: 'ordem-servico-painel' })
}

function newItem() {
  selectItem.value = null
  itemDialogVisible.value = true
}

function editItem(item: TItemOrdemServico) {
  selectItem.value = item
  itemDialogVisible.value = true
}

async function removeOrderItem(item: TItemOrdemServico) {
  if (!order.value || !(await confirmAction())) return

  try {
    const data = {
      operacao: 'REMOVER_ITEM',
      cn_ordem_servico: order.value.cn_ordem_servico,
      cn_item: item.cn_item,
    }

    await removeItem(data.cn_ordem_servico, data.cn_item)
    toast.success('Item removido com sucesso.')
  } catch (error) {
    toast.error(normalizeError(error))
  }
}

function updateItemTime(item: TItemOrdemServico) {
  const index =
    order.value?.itens.findIndex(
      (currentRequest) => String(currentRequest.cn_item) === String(item.cn_item),
    ) ?? -1
  if (order.value && index >= 0) order.value.itens[index] = item
}

function formatQuantity(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

async function loadOrder() {
  await Promise.all([orderStore.loadOrder(code.value), orderStore.loadParametros()])
}
usePageLoad(loadOrder)
watch(code, () => loadOrder().catch((error) => toast.error(normalizeError(error))))
function updateSale(sale: { cn_venda: string }) {
  if (order.value) order.value.cn_venda = sale.cn_venda
}
</script>

<template>
  <div v-if="order && !isOrderClosed(order)" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <Button
          icon="pi pi-arrow-left"
          severity="secondary"
          text
          aria-label="Voltar ao painel"
          @click="backToPanel"
        />
        <div>
          <h1 class="text-xl font-semibold">
            O.S. #{{ String(order.nu_numero).padStart(6, '0') }}
          </h1>
          <p class="text-surface-500 mt-1">{{ order.an_cliente }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <span
          class="rounded-full px-3 py-1 font-semibold"
          :style="{
            backgroundColor: orderStatus?.cor ?? '#64748b',
            color: statusTextColor(orderStatus?.cor ?? '#64748b'),
          }"
          >{{ orderStatus?.label ?? 'Status indisponível' }}</span
        >
        <Button
          v-if="canWrite('ORDEM_SERVICO') && order.ca_status === 'ABERTO'"
          label="Iniciar serviço"
          icon="pi pi-play"
          @click="moveOrder('INICIAR')"
        />
        <Button
          v-if="canWrite('ORDEM_SERVICO') && order.ca_status === 'EM_ANDAMENTO'"
          label="Finalizar"
          icon="pi pi-check"
          @click="moveOrder('FINALIZAR')"
        />
        <Button
          v-if="canWrite('ORDEM_SERVICO')"
          label="Cancelar O.S."
          severity="secondary"
          @click="moveOrder('CANCELAR')"
        />
      </div>
    </div>
    <Fieldset legend="Dados gerais">
      <p class="mb-4 text-surface-500">Classificação: {{ classification?.an_descr }}</p>
      <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <dt class="text-surface-500">Cliente</dt>
          <dd class="font-semibold mt-1">{{ order.an_cliente }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Entrada</dt>
          <dd class="mt-1">{{ formatDateTime(order.dt_entrada) }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Previsão de entrega</dt>
          <dd class="mt-1">{{ formatDateTime(order.dt_previsao) }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Responsável</dt>
          <dd class="mt-1">{{ order.an_responsavel }}</dd>
        </div>
      </dl>
    </Fieldset>
    <Fieldset legend="Dados do veículo">
      <dl class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <dt class="text-surface-500">Placa</dt>
          <dd class="font-bold mt-1">{{ order.veiculo.an_placa }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Marca</dt>
          <dd class="mt-1">{{ order.veiculo.an_marca }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Modelo</dt>
          <dd class="mt-1">{{ order.veiculo.an_modelo }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Ano</dt>
          <dd class="mt-1">{{ order.veiculo.nu_ano }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Cor</dt>
          <dd class="mt-1">{{ order.veiculo.an_cor }}</dd>
        </div>
        <div>
          <dt class="text-surface-500">Quilometragem</dt>
          <dd class="mt-1">
            {{
              order.veiculo.qt_quilometragem === null
                ? ''
                : formatQuantity(order.veiculo.qt_quilometragem) + ' km'
            }}
          </dd>
        </div>
      </dl>
    </Fieldset>
    <Fieldset legend="Produtos e serviços">
      <div v-if="canWrite('ORDEM_SERVICO')" class="flex justify-end mb-4">
        <Button label="Adicionar" icon="pi pi-plus" @click="newItem" />
      </div>
      <DataTable
        :pt="{ emptyMessage: { class: 'hidden' } }"
        :value="order.itens"
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
          <span class="font-semibold text-primary-600">{{
            data.ca_tipo === 'PRODUTO' ? 'Produtos' : 'Serviços'
          }}</span>
        </template>
        <Column v-if="canWrite('ORDEM_SERVICO')" header="Ações" class="min-w-24">
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
                :disabled="data.ca_tipo === 'SERVICO' && data.ca_status_servico !== 'PENDENTE'"
                aria-label="Remover item"
                @click="removeOrderItem(data)"
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
        <Column header="Tempo de serviço">
          <template #body="{ data }"
            ><TempoServicoItem
              :item="data"
              :editable="canWrite('ORDEM_SERVICO') && order.ca_status === 'EM_ANDAMENTO'"
              @saved="updateItemTime"
          /></template>
        </Column>
        <Column field="ca_unidade" header="Unidade" />
        <Column header="Quantidade">
          <template #body="{ data }">{{ formatQuantity(data.qt_quantidade) }}</template>
        </Column>
        <Column header="Preço unitário">
          <template #body="{ data }">{{ formatOrderCurrency(data.vl_unitario) }}</template>
        </Column>
        <Column header="Total">
          <template #body="{ data }">{{ formatOrderCurrency(data.vl_total) }}</template>
        </Column>
      </DataTable>
    </Fieldset>
    <Fieldset legend="Totais">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 border-t border-surface-200 pt-4">
        <div>
          <p class="text-surface-500">Produtos</p>
          <p class="text-lg font-semibold mt-1">{{ formatOrderCurrency(productsTotal) }}</p>
        </div>
        <div>
          <p class="text-surface-500">Serviços</p>
          <p class="text-lg font-semibold mt-1">{{ formatOrderCurrency(servicesTotal) }}</p>
        </div>
        <div>
          <p class="text-surface-500">Total da ordem</p>
          <p class="text-xl font-bold mt-1">{{ formatOrderCurrency(orderTotal) }}</p>
        </div>
      </div>
    </Fieldset>
    <Fieldset legend="Observações">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p class="text-surface-500 mb-2">Solicitação do cliente</p>
          <p class="whitespace-pre-wrap break-words">{{ order.an_solicitacao }}</p>
        </div>
        <div>
          <p class="text-surface-500 mb-2">Observações internas</p>
          <p class="whitespace-pre-wrap break-words">{{ order.an_obs }}</p>
        </div>
      </div>
    </Fieldset>
    <ManutOrdemServicoDialog v-model:visible="manutOrderVisible" :order="order" />
    <ItemOrdemServicoDialog
      v-model:visible="itemDialogVisible"
      :orderCode="order.cn_ordem_servico"
      :item="selectItem"
    />
  </div>
  <div v-else-if="!order" class="flex flex-col items-start gap-4">
    <p>Esta ordem de serviço não está disponível.</p>
    <Button
      label="Voltar ao painel"
      icon="pi pi-arrow-left"
      severity="secondary"
      @click="backToPanel"
    />
  </div>
  <MovimentarOrdemServicoDialog
    v-model:visible="orderMovementVisible"
    :order="order ?? null"
    :action="action"
  />
  <DetalhesOrdemServicoDialog
    :visible="!!order && isOrderClosed(order)"
    :order="order ?? null"
    @faturada="updateSale"
    @update:visible="backToPanel"
  />
</template>
