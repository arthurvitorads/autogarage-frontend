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
import ToggleSwitch from 'primevue/toggleswitch'
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
const selectClassification = ref<TServiceOrderCode | null>(null)
const loadingGrid = ref(false)
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)

const formData = reactive<IFormClassificacaoOrdemServico>(
  OrderClassificationModel.createForm(classifications.value.length === 0),
)

function loadClassification() {
  const selectedClassification = classifications.value.find(
    (item) => item.cn_classificacao_os === selectClassification.value,
  )

  Object.assign(formData, OrderClassificationModel.createForm(classifications.value.length === 0))
  if (selectedClassification) {
    Object.assign(formData, {
      an_descr: selectedClassification.an_descr,
      ca_cor: selectedClassification.ca_cor,
      bo_padrao: selectedClassification.bo_padrao,
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

async function onSubmit(values: IFormClassificacaoOrdemServico) {
  setLoading(true)

  try {
    const data: IManutClassificacaoOrdemServico = {
      ...(selectClassification.value !== null
        ? { cn_classificacao_os: selectClassification.value }
        : {}),
      an_descr: values.an_descr.trim(),
      ca_cor: values.ca_cor,
      bo_padrao: values.bo_padrao,
    }
    const result = await saveClassification(data)
    emit('saved', result)
    showSuccess('Processo realizado com sucesso.')
    emit('update:visible', false)
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
    :style="{ width: '48rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <FormPage
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
      <div class="mb-2 flex items-center justify-between gap-3">
        <h3 class="font-semibold">Dados da classificação</h3>
        <Button
          type="button"
          icon="pi pi-plus"
          aria-label="Limpar formulário"
          title="Limpar formulário"
          :disabled="loading || loadingGrid"
          @click="handleClassification(null)"
        />
      </div>
      <div class="rounded-md border border-surface-200 p-5">
        <div class="grid grid-cols-3 gap-x-2">
          <FieldForm
            compact
            class="m-[4px] col-span-2 min-w-0"
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
          <FieldForm compact class="m-[4px] min-w-0" name="ca_cor" v-slot="{ invalid, field }">
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
          <FieldForm
            compact
            class="m-[4px] col-span-full"
            name="bo_padrao"
            label="Padrão para novas ordens"
            v-slot="{ field }"
          >
            <ToggleSwitch
              v-model="formData.bo_padrao"
              :name="field"
              aria-label="Usar como classificação padrão em novas ordens"
            />
          </FieldForm>
        </div>
      </div>
    </FormPage>
    <DataTable
      :value="classifications"
      :loading="loadingGrid"
      size="small"
      scrollable
      scrollHeight="14rem"
      class="mt-4"
    >
      <Column v-if="canWrite('CADASTROS')" header="Ações">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            aria-label="Editar classificação"
            @click="handleClassification(data.cn_classificacao_os)"
          />
        </template>
      </Column>
      <Column field="an_descr" header="Descrição" />
      <Column header="Cor"
        ><template #body="{ data }"
          ><span
            class="inline-block w-5 h-5 rounded"
            :style="{ background: data.ca_cor }"
          ></span></template
      ></Column>
      <Column header="Padrão"
        ><template #body="{ data }">{{ data.bo_padrao ? 'Sim' : 'Não' }}</template></Column
      >
    </DataTable>
    <template v-if="canWrite('CADASTROS')" #footer>
      <div class="flex w-full justify-end gap-2 border-t border-surface-200 pt-4">
        <Button
          type="button"
          label="Cancelar"
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
