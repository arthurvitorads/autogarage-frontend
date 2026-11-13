<script setup lang="ts">
import FloatLabel from 'primevue/floatlabel'
import { OrderClassificationModel } from '@/models/order-classification.model'
import type { IFormPageRef } from '@/interface/util'
import type { IDialogProps } from '@/interface/dialog'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'

import Dialog from 'primevue/dialog'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type {
  IFormOrderClassification,
  IManutOrderClassification,
  IClassificacaoOrdemServico,
  TServiceOrderCode,
} from '@/interface/interface-pages/OrdemServicoPage'
import type { TGenericData } from '@/interface/util'

import { corTextoStatus as statusTextColor } from '@/services/ordem-servico.service'
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
const isEditing = computed(() => selectClassification.value !== null)
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)

const formData = ref<IFormOrderClassification>(
  OrderClassificationModel.createForm(classifications.value.length === 0),
)

function loadClassification() {
  const selectedClassification = classifications.value.find(
    (item) => item.cn_classificacao === selectClassification.value,
  )

  formData.value = selectedClassification
    ? {
        an_descr: selectedClassification.an_descr,
        ca_cor: selectedClassification.ca_cor,
        bo_padrao: selectedClassification.bo_padrao,
      }
    : OrderClassificationModel.createForm(classifications.value.length === 0)
  formErrors.value = {}
  formKey.value++
}

function newClassification() {
  selectClassification.value = null
  loadClassification()
}

async function onSubmit(values: IFormOrderClassification) {
  const errors: TGenericData = {}

  if (!values.an_descr.trim()) errors.an_descr = 'Campo obrigatório.'
  if (!/^#[a-fA-F0-9]{6}$/.test(values.ca_cor)) errors.ca_cor = 'Selecione uma cor válida.'

  formErrors.value = errors
  if (Object.keys(errors).length) return

  setLoading(true)

  try {
    const data: IManutOrderClassification = {
      ...(selectClassification.value !== null
        ? { cn_classificacao: selectClassification.value }
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

watch(selectClassification, loadClassification)
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      try {
        await orderStore.loadParametros()
        newClassification()
      } catch (error) {
        showError(normalizeError(error))
      }
    }
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Classificações da O.S.' : 'Classificações da O.S.'"
    modal
    :style="{ width: '48rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <div v-if="canWrite('CADASTROS')" class="flex justify-end mb-3">
      <Button label="Novo" icon="pi pi-plus" @click="newClassification" />
    </div>
    <DataTable :value="classifications" size="small" scrollable scrollHeight="14rem" class="mb-4">
      <Column v-if="canWrite('CADASTROS')" header="Ações"
        ><template #body="{ data }"
          ><Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            aria-label="Editar classificação"
            @click="selectClassification = data.cn_classificacao" /></template
      ></Column>
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
      <template #empty>Nenhuma classificação disponível.</template>
    </DataTable>
    <FormPage
      v-if="canWrite('CADASTROS')"
      ref="formRef"
      :key="formKey"
      novalidate
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit(formData)"
    >
      <Fieldset legend="Dados da classificação">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-9"
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
              <label for="ClassificacaoOrdemServicoDialog-an_descr">Nome *</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-3"
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
              <label for="ClassificacaoOrdemServicoDialog-ca_cor">Cor *</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12"
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
          <div class="col-span-12 mt-2">
            <span
              class="inline-flex rounded-full px-3 py-1 font-semibold"
              :style="{ backgroundColor: formData.ca_cor, color: statusTextColor(formData.ca_cor) }"
              >{{ formData.an_descr || 'Prévia da classificação' }}</span
            >
          </div>
        </div>
      </Fieldset>
    </FormPage>
    <template v-if="canWrite('CADASTROS')" #footer>
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
</template>
