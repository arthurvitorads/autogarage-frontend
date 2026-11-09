<script setup lang="ts">
import { ServiceOrderModel } from '@/models/service-order.model'
import type { IFormPageRef } from '@/interface/util'
import type { IManutServiceOrderDialogProps } from '@/interface/dialog'
import { useConfirmacao as useConfirmation } from '@/composables/useConfirmacao'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

import Dialog from 'primevue/dialog'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'
import ClassificacaoOrdemServicoDialog from '@/components/dialogs/ClassificacaoOrdemServicoDialog.vue'

import type {
  IAdmOrdemServico,
  IFormServiceOrder,
  IManutServiceOrder,
  IClassificacaoOrdemServico,
} from '@/interface/interface-pages/OrdemServicoPage'
import type { TGenericData } from '@/interface/util'

import {
  dataHoraLocal as localDateTime,
  normalizarPlaca as normalizePlate,
  validarDadosOrdem as validateOrderData,
} from '@/services/ordem-servico.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'

const props = defineProps<IManutServiceOrderDialogProps>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [ordem: IAdmOrdemServico]
}>()

const orderStore = useServiceOrderStore()
const {
  clientes: customers,
  classificacoes: classifications,
  classificacaoPadrao: defaultClassification,
} = storeToRefs(orderStore)
const { saveOrdem: saveOrder } = orderStore
const { normalizeError, setLoading } = useUtilStore()
const { loading } = storeToRefs(useUtilStore())
const toast = useAppToast()
const confirmAction = useConfirmation()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
const classificationDialogVisible = ref(false)
const isEditing = computed(() => !!props.order)
const maxYear = new Date().getFullYear() + 1
const customerOptions = computed(() =>
  customers.value.map((customer) => ({
    ...customer,
    an_label: customer.an_nome + ' — ' + customer.an_documento,
  })),
)

const formData = ref<IFormServiceOrder>(
  ServiceOrderModel.createForm(defaultClassification.value?.cn_classificacao ?? null),
)

function selectClassification(item: IClassificacaoOrdemServico) {
  formData.value.cn_classificacao = item.cn_classificacao
  delete formErrors.value.cn_classificacao
}

async function onSubmit(values: IFormServiceOrder) {
  const errors = validateOrderData(values)

  if (!customers.value.some((customer) => String(customer.cn_pessoa) === String(values.cn_pessoa)))
    errors.cn_pessoa = 'Selecione um cliente ativo disponível.'

  if (!classifications.value.some((item) => item.cn_classificacao === values.cn_classificacao))
    errors.cn_classificacao = 'Selecione uma classificação válida.'

  formErrors.value = errors
  if (Object.keys(errors).length) return

  if (!(await confirmAction())) return

  setLoading(true)

  try {
    if (values.cn_pessoa === null || values.cn_classificacao === null) return

    const data: IManutServiceOrder = {
      ...(props.order ? { cn_ordem_servico: props.order.cn_ordem_servico } : {}),
      cn_pessoa: values.cn_pessoa,
      cn_classificacao: values.cn_classificacao,
      dt_entrada: new Date(values.dt_entrada).toISOString(),
      dt_previsao: values.dt_previsao ? new Date(values.dt_previsao).toISOString() : null,
      an_responsavel: values.an_responsavel.trim(),
      veiculo: {
        an_placa: normalizePlate(values.an_placa),
        an_marca: values.an_marca.trim(),
        an_modelo: values.an_modelo.trim(),
        nu_ano: values.nu_ano,
        an_cor: values.an_cor.trim(),
        qt_quilometragem: values.qt_quilometragem,
      },
      an_solicitacao: values.an_solicitacao.trim(),
      an_obs: values.an_obs.trim(),
    }
    const result = await saveOrder(data)
    emit('saved', result)
    toast.success('Processo realizado com sucesso.')
    emit('update:visible', false)
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(
  [() => props.visible, () => props.order],
  ([visible]) => {
    if (!visible) return

    const order = props.order

    formData.value = order
      ? {
          cn_pessoa: order.cn_pessoa,
          cn_classificacao: order.cn_classificacao,
          dt_entrada: localDateTime(order.dt_entrada),
          dt_previsao: order.dt_previsao ? localDateTime(order.dt_previsao) : '',
          an_responsavel: order.an_responsavel,
          ...order.veiculo,
          an_solicitacao: order.an_solicitacao,
          an_obs: order.an_obs,
        }
      : ServiceOrderModel.createForm(defaultClassification.value?.cn_classificacao ?? null)
    formErrors.value = {}
    formKey.value++
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar ordem de serviço' : 'Nova ordem de serviço'"
    modal
    :style="{ width: '96rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      class="flex flex-col gap-4"
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit(formData)"
    >
      <Fieldset legend="Dados gerais">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="col-span-12 sm:col-span-3" name="nu_numero" label="Número">
            <InputText
              maxlength="4000"
              :modelValue="order ? String(order.nu_numero).padStart(6, '0') : 'Automático'"
              readonly
              fluid
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-6"
            name="cn_pessoa"
            label="Cliente *"
            v-slot="{ invalid, field }"
          >
            <Select
              v-model="formData.cn_pessoa"
              :name="field"
              :options="customerOptions"
              optionLabel="an_label"
              optionValue="cn_pessoa"
              placeholder="Selecione o cliente PF ou PJ"
              :invalid="invalid"
              filter
              fluid
              emptyMessage="Nenhum cliente disponível."
              emptyFilterMessage="Nenhum cliente corresponde à pesquisa."
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-3"
            name="cn_classificacao"
            label="Classificação *"
            v-slot="{ invalid, field }"
          >
            <div class="flex gap-2">
              <Select
                v-model="formData.cn_classificacao"
                :name="field"
                :options="classifications"
                optionLabel="an_descr"
                optionValue="cn_classificacao"
                :invalid="invalid"
                fluid
                class="flex-1 min-w-0"
                placeholder="Selecione a classificação"
              />
              <Button
                type="button"
                icon="pi pi-plus"
                aria-label="Cadastrar classificação"
                @click="classificationDialogVisible = true"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-4"
            name="dt_entrada"
            label="Entrada *"
            v-slot="{ invalid, field }"
          >
            <InputText
              maxlength="4000"
              v-model="formData.dt_entrada"
              :name="field"
              type="datetime-local"
              :invalid="invalid"
              fluid
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-4"
            name="dt_previsao"
            label="Previsão de entrega"
            v-slot="{ invalid, field }"
          >
            <InputText
              maxlength="4000"
              v-model="formData.dt_previsao"
              :name="field"
              type="datetime-local"
              :invalid="invalid"
              fluid
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-4"
            name="an_responsavel"
            label="Responsável"
            v-slot="{ field }"
          >
            <InputText maxlength="4000" v-model="formData.an_responsavel" :name="field" fluid />
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset legend="Dados do veículo">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="col-span-12 sm:col-span-3"
            name="an_placa"
            label="Placa *"
            v-slot="{ invalid, field }"
          >
            <InputText
              v-model="formData.an_placa"
              :name="field"
              :invalid="invalid"
              maxlength="8"
              fluid
              @update:modelValue="formData.an_placa = ($event ?? '').toUpperCase()"
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-4"
            name="an_marca"
            label="Marca *"
            v-slot="{ invalid, field }"
          >
            <InputText
              maxlength="4000"
              v-model="formData.an_marca"
              :name="field"
              :invalid="invalid"
              fluid
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-5"
            name="an_modelo"
            label="Modelo *"
            v-slot="{ invalid, field }"
          >
            <InputText
              maxlength="4000"
              v-model="formData.an_modelo"
              :name="field"
              :invalid="invalid"
              fluid
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-4"
            name="nu_ano"
            label="Ano"
            v-slot="{ invalid, field }"
          >
            <InputNumber
              v-model="formData.nu_ano"
              :name="field"
              :invalid="invalid"
              :min="1900"
              :max="maxYear"
              :useGrouping="false"
              fluid
            />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="an_cor" label="Cor" v-slot="{ field }">
            <InputText maxlength="4000" v-model="formData.an_cor" :name="field" fluid />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-4"
            name="qt_quilometragem"
            label="Quilometragem"
            v-slot="{ invalid, field }"
          >
            <InputNumber
              v-model="formData.qt_quilometragem"
              :name="field"
              :invalid="invalid"
              :min="0"
              :max="9999999"
              locale="pt-BR"
              fluid
            />
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset legend="Observações">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="col-span-12 sm:col-span-6"
            name="an_solicitacao"
            label="Solicitação do cliente"
            v-slot="{ field }"
          >
            <Textarea
              maxlength="4000"
              v-model="formData.an_solicitacao"
              :name="field"
              rows="2"
              fluid
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-6"
            name="an_obs"
            label="Observações internas"
            v-slot="{ field }"
          >
            <Textarea maxlength="4000" v-model="formData.an_obs" :name="field" rows="2" fluid />
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
          :disabled="loading"
          :loading="loading"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </Dialog>
  <ClassificacaoOrdemServicoDialog
    v-model:visible="classificationDialogVisible"
    @saved="selectClassification"
  />
</template>
