<script setup lang="ts">
import type { TItemOrdemServico } from '@/interface/tables'
import type { IServiceOrderItemDialogProps } from '@/interface/pages/OrdemServicoPage'
import FloatLabel from 'primevue/floatlabel'
import { ServiceOrderItemModel } from '@/models/service-order-item.model'
import type { IFormPageRef } from '@/interface/util'
import { useConfirmacao as useConfirmation } from '@/composables/useConfirmacao'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'

import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type {
  IFormServiceOrderItem,
  TManutServiceOrderItem,
  TServiceOrderCode,
} from '@/interface/pages/OrdemServicoPage'
import type { TGenericData } from '@/interface/util'

import {
  calcularTotalItemOrdem as calculateItemTotal,
  formatCurrencyOrdem as formatOrderCurrency,
  isPrecoOrdemValido as isValidOrderPrice,
} from '@/services/ordem-servico.service'
import { isQuantidadeValida as isValidQuantity } from '@/services/estoque.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { getCatalogItemOptions } from '@/services/catalogo.service'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'

const props = defineProps<IServiceOrderItemDialogProps>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: []
}>()

const catalog = ref<Awaited<ReturnType<typeof getCatalogItemOptions>>['dados'] | null>(null)
const loadingOptions = ref(false)
const { saveItem } = useServiceOrderStore()
const { normalizeError, setLoading } = useUtilStore()
const { loading } = storeToRefs(useUtilStore())
const { showSuccess, showError } = useAppToast()
const confirmAction = useConfirmation()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
const itemTypes = [
  { label: 'Produto', value: 'PRODUTO' },
  { label: 'Serviço', value: 'SERVICO' },
]

const formData = ref<IFormServiceOrderItem>(
  ServiceOrderItemModel.createForm(props.itemType ?? 'PRODUTO'),
)
const options = computed(
  () =>
    (formData.value.ca_tipo === 'PRODUTO' ? catalog.value?.produtos : catalog.value?.servicos) ??
    [],
)
const selectedReference = computed(() =>
  options.value.find((item) => item.cn_referencia === formData.value.cn_referencia),
)
const totalItem = computed(() => {
  if (formData.value.qt_quantidade === null || formData.value.vl_unitario === null) return null

  try {
    return calculateItemTotal(formData.value.qt_quantidade, formData.value.vl_unitario)
  } catch {
    return null
  }
})

function changeType() {
  formData.value.cn_referencia = null
  formData.value.vl_unitario = 0
  formErrors.value = {}
}

function loadPrice() {
  formData.value.vl_unitario = selectedReference.value?.vl_preco ?? 0
  delete formErrors.value.cn_referencia
  delete formErrors.value.vl_unitario
}

async function onSubmit(values: IFormServiceOrderItem) {
  const errors: TGenericData = {}

  if (!selectedReference.value) errors.cn_referencia = 'Selecione um produto ou serviço ativo.'

  if (!isValidQuantity(values.qt_quantidade) || values.qt_quantidade === 0)
    errors.qt_quantidade = 'Informe uma quantidade maior que zero, com até três casas decimais.'

  if (!isValidOrderPrice(values.vl_unitario))
    errors.vl_unitario = 'Informe um preço válido, com até duas casas decimais.'

  if (
    !errors.qt_quantidade &&
    !errors.vl_unitario &&
    values.qt_quantidade !== null &&
    values.vl_unitario !== null
  ) {
    try {
      calculateItemTotal(values.qt_quantidade, values.vl_unitario)
    } catch (error) {
      errors.vl_unitario = normalizeError(error)
    }
  }

  formErrors.value = errors
  if (Object.keys(errors).length) return

  if (!(await confirmAction())) return

  setLoading(true)

  try {
    if (
      values.cn_referencia === null ||
      values.qt_quantidade === null ||
      values.vl_unitario === null
    )
      return

    const dadosBase = {
      cn_ordem_servico: props.orderCode,
      ...(props.item ? { cn_item: props.item.cn_item } : {}),
      qt_quantidade: values.qt_quantidade,
      vl_unitario: values.vl_unitario,
    }
    const data: TManutServiceOrderItem =
      values.ca_tipo === 'PRODUTO'
        ? {
            ...dadosBase,
            ca_tipo: 'PRODUTO',
            cn_produto: values.cn_referencia,
          }
        : {
            ...dadosBase,
            ca_tipo: 'SERVICO',
            cn_servico: values.cn_referencia,
          }

    await saveItem(data)
    emit('saved')
    showSuccess('Processo realizado com sucesso.')
    emit('update:visible', false)
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(
  [() => props.visible, () => props.item],
  ([visible]) => {
    if (!visible) return

    const item = props.item

    formData.value = item
      ? {
          ca_tipo: item.ca_tipo,
          cn_referencia: item.ca_tipo === 'PRODUTO' ? item.cn_produto : item.cn_servico,
          qt_quantidade: item.qt_quantidade,
          vl_unitario: item.vl_unitario,
        }
      : ServiceOrderItemModel.createForm(props.itemType ?? 'PRODUTO')
    formErrors.value = {}
    formKey.value++
  },
  { immediate: true },
)
watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return
    catalog.value = null
    loadingOptions.value = true
    try {
      const { dados } = await getCatalogItemOptions()
      catalog.value = dados
    } catch (error) {
      showError(normalizeError(error))
    } finally {
      loadingOptions.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="item ? 'Editar item da ordem' : 'Adicionar produto ou serviço'"
    modal
    :style="{ width: '64rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit(formData)"
    >
      <Fieldset legend="Dados do item">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="m-[4px] col-span-12" name="ca_tipo" label="Tipo">
            <SelectButton
              v-model="formData.ca_tipo"
              :options="itemTypes"
              optionLabel="label"
              optionValue="value"
              :allowEmpty="false"
              @change="changeType"
            />
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-9"
            name="cn_referencia"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <Select
                inputId="ItemOrdemServicoDialog-cn_referencia"
                v-model="formData.cn_referencia"
                :name="field"
                :options="options"
                optionLabel="an_nome"
                optionValue="cn_referencia"
                :invalid="invalid"
                filter
                fluid
                @change="loadPrice"
              />
              <label for="ItemOrdemServicoDialog-cn_referencia">{{
                formData.ca_tipo === 'PRODUTO' ? 'Produto *' : 'Serviço *'
              }}</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-3" name="ca_unidade">
            <FloatLabel variant="on">
              <InputText
                id="ItemOrdemServicoDialog-ca_unidade"
                maxlength="10"
                :modelValue="selectedReference?.ca_unidade ?? ''"
                readonly
                fluid
              />
              <label for="ItemOrdemServicoDialog-ca_unidade">Unidade</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-4"
            name="qt_quantidade"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputNumber
                inputId="ItemOrdemServicoDialog-qt_quantidade"
                v-model="formData.qt_quantidade"
                :name="field"
                :invalid="invalid"
                :min="0"
                :max="999999999.999"
                :maxFractionDigits="3"
                locale="pt-BR"
                fluid
              />
              <label for="ItemOrdemServicoDialog-qt_quantidade">Quantidade *</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-4"
            name="vl_unitario"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputNumber
                inputId="ItemOrdemServicoDialog-vl_unitario"
                v-model="formData.vl_unitario"
                :name="field"
                :invalid="invalid"
                :min="0"
                :max="999999999.99"
                mode="currency"
                currency="BRL"
                locale="pt-BR"
                fluid
              />
              <label for="ItemOrdemServicoDialog-vl_unitario">Preço unitário *</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-4" name="vl_total">
            <FloatLabel variant="on">
              <InputText
                id="ItemOrdemServicoDialog-vl_total"
                maxlength="4000"
                :modelValue="totalItem === null ? '' : formatOrderCurrency(totalItem)"
                readonly
                fluid
              />
              <label for="ItemOrdemServicoDialog-vl_total">Total do item</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </Fieldset>
    </FormPage>
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
          :disabled="loading || loadingOptions || !catalog"
          :loading="loading || loadingOptions"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </Dialog>
</template>
