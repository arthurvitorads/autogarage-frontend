<script setup lang="ts">
import type { IServiceOrderDetailsDialogProps } from '@/interface/dialog'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ManutVendaDialog from '@/components/dialogs/ManutVendaDialog.vue'
import TempoServicoItem from '@/components/field/TempoServicoItem.vue'
import type { IAdmVenda } from '@/interface/interface-pages/VendaPage'
import { storeToRefs } from 'pinia'
import Dialog from 'primevue/dialog'
import Fieldset from 'primevue/fieldset'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { IAdmOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'
import {
  getStatusOrdem as getOrderStatus,
  calcularTotalOrdem as calculateOrderTotal,
  formatCurrencyOrdem as formatOrderCurrency,
} from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'
import { useUtilStore } from '@/stores/util.store'

const props = defineProps<IServiceOrderDetailsDialogProps>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; faturada: [venda: IAdmVenda] }>()
const router = useRouter()
const { canRead, canWrite } = useUtilStore()
const saleDialogVisible = ref(false)
const registeredSale = ref<string | null>(null)
watch(
  () => [props.visible, props.order?.cn_ordem_servico],
  () => {
    registeredSale.value = props.order?.cn_venda ?? null
  },
)
function onSaleSaved(sale: IAdmVenda) {
  registeredSale.value = sale.cn_venda
  emit('faturada', sale)
}
function viewSale() {
  emit('update:visible', false)
  router.push({ name: 'faturamento-vendas', query: { venda: registeredSale.value! } })
}
const { classificacoes: classifications } = storeToRefs(useServiceOrderStore())
const classification = computed(() =>
  classifications.value.find(
    (item) => String(item.cn_classificacao) === String(props.order?.cn_classificacao),
  ),
)
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    header="Detalhes da O.S."
    modal
    :style="{ width: '76rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <div v-if="order" class="flex flex-col gap-4">
      <h2 class="text-xl font-semibold">
        O.S. #{{ String(order.nu_numero).padStart(6, '0') }} —
        {{ getOrderStatus(order.ca_status).label }}
      </h2>
      <Fieldset legend="Dados gerais">
        <dl class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <dt class="text-surface-500">Cliente</dt>
            <dd>{{ order.an_cliente }}</dd>
          </div>
          <div>
            <dt class="text-surface-500">Classificação</dt>
            <dd>{{ classification?.an_descr }}</dd>
          </div>
          <div>
            <dt class="text-surface-500">Responsável</dt>
            <dd>{{ order.an_responsavel }}</dd>
          </div>
          <div>
            <dt class="text-surface-500">Entrada</dt>
            <dd>{{ formatDateTime(order.dt_entrada) }}</dd>
          </div>
          <div>
            <dt class="text-surface-500">Previsão</dt>
            <dd>{{ formatDateTime(order.dt_previsao) }}</dd>
          </div>
          <div>
            <dt class="text-surface-500">Início do serviço</dt>
            <dd>{{ formatDateTime(order.dt_inicio) }}</dd>
          </div>
          <div v-if="order.ca_status === 'FINALIZADO'">
            <dt class="text-surface-500">Finalização</dt>
            <dd>{{ formatDateTime(order.dt_finalizacao) }}</dd>
          </div>
        </dl>
      </Fieldset>
      <Fieldset v-if="order.ca_status === 'CANCELADO'" legend="Detalhes do cancelamento">
        <p class="text-surface-500 mb-2">{{ formatDateTime(order.dt_cancelamento) }}</p>
        <p class="whitespace-pre-wrap break-words">
          {{ order.an_motivo_cancelamento || 'Motivo não registrado na ordem antiga.' }}
        </p>
      </Fieldset>
      <Fieldset legend="Veículo">
        <dl class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <dt class="text-surface-500">Placa</dt>
            <dd>{{ order.veiculo.an_placa }}</dd>
          </div>
          <div>
            <dt class="text-surface-500">Marca</dt>
            <dd>{{ order.veiculo.an_marca }}</dd>
          </div>
          <div>
            <dt class="text-surface-500">Modelo</dt>
            <dd>{{ order.veiculo.an_modelo }}</dd>
          </div>
          <div>
            <dt class="text-surface-500">Ano</dt>
            <dd>{{ order.veiculo.nu_ano }}</dd>
          </div>
          <div>
            <dt class="text-surface-500">Cor</dt>
            <dd>{{ order.veiculo.an_cor }}</dd>
          </div>
          <div>
            <dt class="text-surface-500">Quilometragem</dt>
            <dd>{{ order.veiculo.qt_quilometragem }}</dd>
          </div>
        </dl>
      </Fieldset>
      <Fieldset legend="Produtos e serviços">
        <DataTable
          :value="order.itens"
          rowGroupMode="subheader"
          groupRowsBy="ca_tipo"
          sortField="ca_tipo"
          :sortOrder="1"
          size="small"
          scrollable
        >
          <template #groupheader="{ data }"
            ><strong>{{ data.ca_tipo === 'PRODUTO' ? 'Produtos' : 'Serviços' }}</strong></template
          >
          <Column field="an_descr" header="Descrição" />
          <Column header="Tempo de serviço"
            ><template #body="{ data }"><TempoServicoItem :item="data" /></template
          ></Column>
          <Column field="ca_unidade" header="Unidade" />
          <Column header="Quantidade"
            ><template #body="{ data }">{{
              data.qt_quantidade.toLocaleString('pt-BR')
            }}</template></Column
          >
          <Column header="Unitário" :bodyStyle="{ textAlign: 'end' }"
            ><template #body="{ data }">{{
              formatOrderCurrency(data.vl_unitario)
            }}</template></Column
          >
          <Column header="Total" :bodyStyle="{ textAlign: 'end' }"
            ><template #body="{ data }">{{ formatOrderCurrency(data.vl_total) }}</template></Column
          >
          <template #empty>Nenhum item cadastrado.</template>
        </DataTable>
        <p class="text-right font-bold mt-4">
          Total: {{ formatOrderCurrency(calculateOrderTotal(order.itens)) }}
        </p>
      </Fieldset>
      <Fieldset legend="Observações">
        <p class="text-surface-500">Solicitação do cliente</p>
        <p class="whitespace-pre-wrap break-words mb-3">{{ order.an_solicitacao }}</p>
        <p class="text-surface-500">Observações internas</p>
        <p class="whitespace-pre-wrap break-words">{{ order.an_obs }}</p>
      </Fieldset>
    </div>
    <template #footer>
      <Button
        v-if="
          canWrite('FATURAMENTO') &&
          order?.ca_status === 'FINALIZADO' &&
          order.itens.length &&
          !registeredSale
        "
        label="Gerar venda"
        icon="pi pi-shopping-cart"
        @click="saleDialogVisible = true"
      />
      <Button
        v-if="canRead('FATURAMENTO') && registeredSale"
        label="Consultar venda"
        icon="pi pi-eye"
        severity="secondary"
        @click="viewSale"
      />
      <Button
        v-if="order?.ca_status === 'CANCELADO'"
        label="Reabrir O.S."
        icon="pi pi-replay"
        disabled
        severity="secondary"
        title="Disponível em uma próxima etapa"
      />
      <Button label="Fechar" @click="emit('update:visible', false)" />
    </template>
  </Dialog>
  <ManutVendaDialog v-model:visible="saleDialogVisible" :order="order" @saved="onSaleSaved" />
</template>
