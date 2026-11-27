<script setup lang="ts">
import type { IClassificacaoOrdemServico } from '@/interface/tables'
import FloatLabel from 'primevue/floatlabel'
import { OrderClassificationModel } from '@/models/order-classification.model'
import type { IFormPageRef } from '@/interface/util'
import type { IDialogProps } from '@/interface/dialog'
import { reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

import Dialog from 'primevue/dialog'
import FormPage from '@/components/pages/FormPage.vue'
import config from '@/config/OrdemServicoPageConfig.json'
import FieldForm from '@/components/field/FieldForm.vue'

import type {
  IFormClassificacaoOrdemServico,
  IManutClassificacaoOrdemServico,
  TServiceOrderCode,
} from '@/interface/pages/OrdemServicoPage'
import type { TGenericData } from '@/interface/util'

import { useAppToast } from '@/services/toast.service'
import { useConfirmacao } from '@/composables/useConfirmacao'
import { useUtilStore } from '@/stores/util.store'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'

const props = defineProps<IDialogProps>()
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [classificacoes: IClassificacaoOrdemServico]
}>()

const orderStore = useServiceOrderStore()
const { classificacoes: classifications } = storeToRefs(orderStore)
const { saveClassificacao: saveClassification } = orderStore
const { normalizeError, setLoading, canWrite } = useUtilStore()
const { loading } = storeToRefs(useUtilStore())
const { showSuccess, showError } = useAppToast()
const confirmar = useConfirmacao()
const selectClassification = ref<TServiceOrderCode | null>(null)
const loadingGrid = ref(false)
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)

const formData = reactive<IFormClassificacaoOrdemServico>(OrderClassificationModel.createForm())

function loadClassification() {
  const selectedClassification = classifications.value.find(
    (item) => item.cn_classificacao_os === selectClassification.value,
  )

  Object.assign(formData, OrderClassificationModel.createForm())
  if (selectedClassification) {
    Object.assign(formData, {
      an_descr: selectedClassification.an_descr,
      ca_cor: selectedClassification.ca_cor,
    })
  }
  formErrors.value = {}
  formKey.value++
}

function handleClassification(code: TServiceOrderCode | null) {
  selectClassification.value = code
  loadClassification()
}

function validateForm(values: IFormClassificacaoOrdemServico) {
  const errors: TGenericData = {}

  if (!/^#[a-fA-F0-9]{6}$/.test(values.ca_cor)) errors.ca_cor = 'Selecione uma cor válida.'

  return errors
}

function clearCode() {
  if (loading.value || loadingGrid.value) return
  handleClassification(null)
}

async function onSubmit(values: IFormClassificacaoOrdemServico) {
  if (loading.value || !(await confirmar())) return

  setLoading(true)

  try {
    const data: IManutClassificacaoOrdemServico = {
      ...(selectClassification.value !== null
        ? { cn_classificacao_os: selectClassification.value }
        : {}),
      an_descr: values.an_descr.trim(),
      ca_cor: values.ca_cor,
    }
    const result = await saveClassification(data)
    handleClassification(result.cn_classificacao_os)
    emit('saved', result)
    showSuccess('Processo realizado com sucesso.')
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return

    handleClassification(null)
    loadingGrid.value = true
    try {
      await orderStore.loadParametros()
      if (props.visible) handleClassification(null)
    } catch (error) {
      showError(normalizeError(error))
    } finally {
      loadingGrid.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    header="Classificações da O.S."
    modal
    contentClass="flex min-h-0 flex-1 flex-col"
    :contentStyle="{ scrollbarWidth: 'none' }"
    :style="{ width: '48rem', height: '34rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <FormPage
      class="shrink-0"
      v-if="canWrite('CADASTROS')"
      ref="formRef"
      :key="formKey"
      novalidate
      v-model:errors="formErrors"
      :initialValues="formData"
      :modelValues="formData"
      :fields="config.classificationFields"
      :validate="validateForm"
      @submit="onSubmit"
    >
      <div class="rounded-md border border-surface-200 p-5">
        <div class="grid grid-cols-12 gap-x-2">
          <div class="m-[4px] col-span-12 sm:col-span-3">
            <FloatLabel variant="on" class="min-w-0 flex-1">
              <InputText
                id="ClassificacaoOrdemServicoDialog-cn_classificacao_os"
                :modelValue="selectClassification == null ? '' : String(selectClassification)"
                readonly
                fluid
                @keydown.delete.prevent="clearCode"
                @keydown.backspace.prevent="clearCode"
              />
              <label for="ClassificacaoOrdemServicoDialog-cn_classificacao_os">Código</label>
            </FloatLabel>
          </div>
          <FieldForm
            compact
            class="m-[4px] col-span-12 min-w-0 sm:col-span-5"
            name="an_descr"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                id="ClassificacaoOrdemServicoDialog-an_descr"
                maxlength="4000"
                v-model="formData.an_descr"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label for="ClassificacaoOrdemServicoDialog-an_descr">Nome</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            compact
            class="m-[4px] col-span-12 min-w-0 sm:col-span-4"
            name="ca_cor"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                id="ClassificacaoOrdemServicoDialog-ca_cor"
                maxlength="4000"
                v-model="formData.ca_cor"
                :name="field"
                type="color"
                :invalid="invalid"
                fluid
                class="h-10"
                aria-label="Cor da classificação"
              />
              <label for="ClassificacaoOrdemServicoDialog-ca_cor">Cor</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </div>
    </FormPage>
    <DataTable
      :value="classifications"
      :loading="loadingGrid"
      size="small"
      scrollable
      scrollHeight="flex"
      class="mt-4 min-h-24 flex-1"
    >
      <Column v-if="canWrite('CADASTROS')" header="Ações">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            aria-label="Editar"
            @click="handleClassification(data.cn_classificacao_os)"
          />
        </template>
      </Column>
      <Column
        field="cn_classificacao_os"
        header="Código"
        style="width: 72px"
        bodyStyle="text-align: right"
      />
      <Column field="an_descr" header="Descrição" />
      <Column header="Cor"
        ><template #body="{ data }"
          ><span
            class="inline-block w-5 h-5 rounded"
            :style="{ background: data.ca_cor }"
          ></span></template
      ></Column>
    </DataTable>
    <template v-if="canWrite('CADASTROS')" #footer>
      <div class="flex w-full justify-end gap-2 border-t border-surface-200 pt-4">
        <Button
          type="button"
          label="Fechar"
          severity="secondary"
          :disabled="loading"
          @click="emit('update:visible', false)"
        />
        <Button
          type="button"
          label="Gravar"
          :disabled="loading || loadingGrid"
          :loading="loading"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </Dialog>
</template>
