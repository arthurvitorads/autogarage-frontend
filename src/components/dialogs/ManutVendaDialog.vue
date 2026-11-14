<script setup lang="ts">
import type { IManutSaleDialogProps } from '@/interface/pages/VendaPage'
import type { IAdmVenda } from '@/interface/tables'
import FloatLabel from 'primevue/floatlabel'
import { SaleModel } from '@/models/sale.model'
import type { IFormSale } from '@/interface/pages/VendaPage'
import { computed, reactive, ref, toRefs, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Fieldset from 'primevue/fieldset'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'

import type {
  IFormSaleItem,
  IManutSaleItem,
  TBillableOrder,
  TSaleCustomer,
} from '@/interface/pages/VendaPage'
import { getCatalogItemOptions } from '@/services/catalogo.service'
import { getCustomers } from '@/services/ordem-api.service'
import type { IClienteOrdemServico } from '@/interface/pages/OrdemServicoPage'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'
import { createSale, getBillableOrders, getSaleCustomer } from '@/services/faturamento.service'
import {
  calcularTotalItemOrdem as calculateItemTotal,
  formatCurrencyOrdem as formatOrderCurrency,
} from '@/services/ordem-servico.service'

const props = defineProps<IManutSaleDialogProps>()
const formData = reactive<IFormSale>(SaleModel.createForm())
const { origin, personId, orderId, notes, requestKey, items } = toRefs(formData)
const emit = defineEmits<{ 'update:visible': [visible: boolean]; saved: [venda: IAdmVenda] }>()
const catalog = ref<Awaited<ReturnType<typeof getCatalogItemOptions>>['dados'] | null>(null)
const customers = ref<IClienteOrdemServico[]>([])
const orders = ref<TBillableOrder[]>([])
const { setLoading, normalizeError } = useUtilStore()
const { loading } = storeToRefs(useUtilStore())
const { showError, showWarn, showSuccess } = useAppToast()

const customer = ref<TSaleCustomer | null>(null)

const saving = ref(false)
const loadingData = ref(false)
const loadError = ref('')
const item = ref<IFormSaleItem>(SaleModel.createItem())
const originOptions = [
  { label: 'Venda avulsa', value: 'DIRETA' },
  { label: 'Por ordem de serviço', value: 'ORDEM_SERVICO' },
]
const itemTypes = [
  { label: 'Produto', value: 'PRODUTO' },
  { label: 'Serviço', value: 'SERVICO' },
]
const availableOrders = computed(() =>
  orders.value.map((order) => ({
    ...order,
    an_label: 'O.S. ' + order.nu_numero + ' — ' + order.an_cliente,
  })),
)
const selectedOrder = computed(
  () =>
    props.order ??
    orders.value.find((order) => String(order.cn_ordem_servico) === String(orderId.value)) ??
    null,
)
const references = computed(
  () =>
    (item.value.ca_tipo === 'PRODUTO' ? catalog.value?.produtos : catalog.value?.servicos) ?? [],
)
const rows = computed(() =>
  origin.value === 'ORDEM_SERVICO' ? (selectedOrder.value?.itens ?? []) : items.value,
)
const total = computed(
  () => rows.value.reduce((soma, linha) => soma + Math.round(linha.vl_total * 100), 0) / 100,
)
let customerRequestId = 0
watch([personId, orderId], async ([code, order]) => {
  const requestId = ++customerRequestId
  customer.value = null
  if (!code) return
  try {
    const { dados: data } = await getSaleCustomer(
      code,
      origin.value === 'ORDEM_SERVICO' ? (order ?? undefined) : undefined,
    )
    if (requestId === customerRequestId) customer.value = data
  } catch (error) {
    if (requestId === customerRequestId) showError(normalizeError(error))
  }
})
watch([origin, selectedOrder], () => {
  if (origin.value === 'ORDEM_SERVICO') personId.value = selectedOrder.value?.cn_pessoa ?? null
})
watch(origin, (value) => {
  if (value === 'DIRETA') personId.value = null
})
watch(
  () => [item.value.ca_tipo, item.value.cn_referencia],
  () => {
    item.value.vl_unitario =
      references.value.find((ref) => ref.cn_referencia === item.value.cn_referencia)?.vl_preco ?? 0
  },
)
watch(
  () => item.value.ca_tipo,
  () => {
    item.value.cn_referencia = null
  },
)

async function loadData() {
  loadingData.value = true
  loadError.value = ''
  try {
    if (props.order) return
    const [itemOptions, clientOptions, billableOrders] = await Promise.all([
      getCatalogItemOptions(),
      getCustomers(),
      getBillableOrders(),
    ])
    catalog.value = itemOptions.dados
    customers.value = clientOptions.dados
    orders.value = billableOrders
  } catch (error) {
    loadError.value = normalizeError(error)
  } finally {
    loadingData.value = false
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return
    Object.assign(formData, SaleModel.createForm(props.order))
    item.value = SaleModel.createItem()
    await loadData()
  },
)

function addItem() {
  try {
    const reference = references.value.find((ref) => ref.cn_referencia === item.value.cn_referencia)
    if (!reference) throw new Error('Selecione um item.')
    const lineTotal = calculateItemTotal(item.value.qt_quantidade!, item.value.vl_unitario!)
    items.value.push({
      ca_tipo: item.value.ca_tipo,
      cn_produto: item.value.ca_tipo === 'PRODUTO' ? reference.cn_referencia : null,
      cn_servico: item.value.ca_tipo === 'SERVICO' ? reference.cn_referencia : null,
      qt_quantidade: item.value.qt_quantidade!,
      vl_unitario: item.value.vl_unitario!,
      an_descr: reference.an_nome,
      vl_total: lineTotal,
    })
  } catch (error) {
    showError(normalizeError(error))
  }
}

async function save() {
  if (saving.value || loadingData.value) return
  if (!customer.value || !personId.value || !rows.value.length) {
    showWarn('Selecione o cliente e adicione pelo menos um item.')
    return
  }
  if (
    origin.value === 'ORDEM_SERVICO' &&
    (!selectedOrder.value || selectedOrder.value.ca_status !== 'FINALIZADO')
  ) {
    showWarn('Selecione uma O.S. finalizada.')
    return
  }
  saving.value = true
  setLoading(true)
  try {
    const { dados: data } = await createSale({
      cn_pessoa: personId.value,
      ca_chave_requisicao: requestKey.value,
      an_obs: notes.value,
      ...(origin.value === 'ORDEM_SERVICO'
        ? { cn_ordem_servico: selectedOrder.value!.cn_ordem_servico }
        : { itens: items.value.map(({ an_descr, vl_total, ...data }) => data) }),
    })
    showSuccess('Venda registrada com sucesso.')
    emit('saved', data)
    emit('update:visible', false)
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    saving.value = false
    setLoading(false)
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    header="Registrar venda"
    modal
    :style="{ width: '82rem', maxWidth: '95vw', maxHeight: '90vh' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4">
      <p v-if="loadingData">Carregando dados da venda...</p>
      <div v-if="loadError" role="alert" class="flex gap-3 items-center">
        <p>{{ loadError }}</p>
        <Button label="Tentar novamente" severity="secondary" @click="loadData" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FloatLabel variant="on" class="m-[4px]">
          <Select
            inputId="venda-origin"
            v-model="origin"
            :options="originOptions"
            optionLabel="label"
            optionValue="value"
            :disabled="!!order || saving"
            aria-label="Origem da venda"
            fluid
          />
          <label for="venda-origin">Origem da venda</label>
        </FloatLabel>
        <FloatLabel variant="on" class="m-[4px]" v-if="origin === 'ORDEM_SERVICO' && !order">
          <Select
            inputId="venda-orderId"
            v-model="orderId"
            :options="availableOrders"
            optionLabel="an_label"
            optionValue="cn_ordem_servico"
            filter
            aria-label="Ordem de serviço"
            fluid
          />
          <label for="venda-orderId">Ordem de serviço</label>
        </FloatLabel>
        <FloatLabel variant="on" class="m-[4px]" v-if="origin === 'DIRETA'">
          <Select
            inputId="venda-personId"
            v-model="personId"
            :options="customers"
            optionLabel="an_nome"
            optionValue="cn_pessoa"
            filter
            aria-label="Cliente da venda"
            fluid
          />
          <label for="venda-personId">Cliente da venda</label>
        </FloatLabel>
      </div>
      <Fieldset legend="Cliente">
        <div v-if="customer" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <p class="font-semibold">{{ customer.an_nome || customer.an_razao_social }}</p>
          <p>{{ customer.ca_cpf || customer.ca_cnpj }}</p>
          <p>{{ customer.an_email }}</p>
          <p>{{ customer.an_telefone }}</p>
          <p v-if="customer.endereco" class="sm:col-span-2">
            {{ customer.endereco.an_logradouro }}, {{ customer.endereco.an_numero }} —
            {{ customer.endereco.an_cidade
            }}{{ customer.endereco.estado ? '/' + customer.endereco.estado.ca_uf : '' }}
          </p>
        </div>
        <p v-else>Selecione um cliente para conferir as informações.</p>
      </Fieldset>
      <Fieldset legend="Itens">
        <div v-if="origin === 'DIRETA'" class="flex flex-wrap gap-2 mb-4 items-end">
          <FloatLabel variant="on" class="m-[4px]">
            <Select
              inputId="venda-item-ca_tipo"
              v-model="item.ca_tipo"
              :options="itemTypes"
              optionLabel="label"
              optionValue="value"
              aria-label="Tipo do item"
              fluid
            />
            <label for="venda-item-ca_tipo">Tipo do item</label>
          </FloatLabel>
          <FloatLabel variant="on" class="m-[4px] min-w-64">
            <Select
              inputId="venda-item-cn_referencia"
              v-model="item.cn_referencia"
              :options="references"
              optionLabel="an_nome"
              optionValue="cn_referencia"
              filter
              aria-label="Produto ou serviço"
              fluid
            />
            <label for="venda-item-cn_referencia">Produto ou serviço</label>
          </FloatLabel>
          <FloatLabel variant="on" class="m-[4px]">
            <InputNumber
              inputId="venda-quantidade"
              v-model="item.qt_quantidade"
              :min="0.001"
              :maxFractionDigits="3"
              class="w-32"
              aria-label="Quantidade"
            />
            <label for="venda-quantidade">Quantidade</label>
          </FloatLabel>
          <FloatLabel variant="on" class="m-[4px]">
            <InputNumber
              inputId="venda-preco-unitario"
              v-model="item.vl_unitario"
              :min="0"
              :max="999999999.99"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              class="w-40"
              aria-label="Preço unitário"
            />
            <label for="venda-preco-unitario">Preço unitário</label>
          </FloatLabel>
          <Button icon="pi pi-plus" label="Adicionar" @click="addItem" />
        </div>
        <DataTable :value="rows" size="small" scrollable tableStyle="min-width: 45rem">
          <Column field="an_descr" header="Descrição" />
          <Column field="ca_tipo" header="Tipo" />
          <Column field="qt_quantidade" header="Quantidade" />
          <Column header="Unitário" :bodyStyle="{ textAlign: 'end' }"
            ><template #body="{ data }">{{
              formatOrderCurrency(data.vl_unitario)
            }}</template></Column
          >
          <Column header="Total" :bodyStyle="{ textAlign: 'end' }"
            ><template #body="{ data }">{{ formatOrderCurrency(data.vl_total) }}</template></Column
          >
          <Column v-if="origin === 'DIRETA'" header="Ações"
            ><template #body="{ index }"
              ><Button
                icon="pi pi-trash"
                text
                severity="danger"
                aria-label="Remover item"
                @click="items.splice(index, 1)" /></template
          ></Column>
          <template #empty>Nenhum item adicionado.</template>
        </DataTable>
        <p class="text-right font-bold mt-3">Total: {{ formatOrderCurrency(total) }}</p>
      </Fieldset>
      <FloatLabel variant="on" class="m-[4px]">
        <Textarea id="venda-observacao" v-model="notes" rows="2" fluid />
        <label for="venda-observacao">Observações</label>
      </FloatLabel>
    </div>
    <template #footer>
      <div class="flex w-full justify-end gap-2 border-t border-surface-200 pt-4">
        <Button
          type="button"
          label="Cancelar"
          severity="secondary"
          @click="emit('update:visible', false)"
        />
        <Button
          type="button"
          label="Gravar"
          :disabled="saving || loadingData || !!loadError || loading"
          :loading="loading"
          @click="save"
        />
      </div>
    </template>
  </Dialog>
</template>
