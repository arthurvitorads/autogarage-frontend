<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'

import CadastroDialog from '@/components/dialogs/CadastroDialog.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type { IFormStatusOrdemServico, IManutStatusOrdemServico, IStatusOrdemServico, TCodigoOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'
import type { TGenericData } from '@/interface/util'

import { corTextoStatus } from '@/services/ordem-servico.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'

const props = defineProps<{
  visible: boolean
}>()
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [status: IStatusOrdemServico]
}>()

const ordemStore = useOrdemServicoStore()
const { status } = storeToRefs(ordemStore)
const { saveStatus } = ordemStore
const { normalizeError, setLoading } = useUtilStore()
const toast = useAppToast()
const selectStatus = ref<TCodigoOrdemServico | null>(null)
const isEditing = computed(() => selectStatus.value !== null)
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<{
  submit: () => void
} | null>(null)

function formDataDefault(): IFormStatusOrdemServico {
  return {
    an_descr: '',
    ca_cor: '#64748b',
    bo_padrao: status.value.length === 0,
  }
}

const formData = ref<IFormStatusOrdemServico>(formDataDefault())

function loadStatus() {
  const selecionado = status.value.find(item => item.cn_status === selectStatus.value)

  formData.value = selecionado ? {
    an_descr: selecionado.an_descr,
    ca_cor: selecionado.ca_cor,
    bo_padrao: selecionado.bo_padrao,
  } : formDataDefault()
  formErrors.value = {}
  formKey.value++
}

function newStatus() {
  selectStatus.value = null
  loadStatus()
}

async function onSubmit(values: IFormStatusOrdemServico) {
  const errors: TGenericData = {}

  if (!values.an_descr.trim())
    errors.an_descr = 'Campo obrigatório.'
  if (!/^#[a-fA-F0-9]{6}$/.test(values.ca_cor))
    errors.ca_cor = 'Selecione uma cor válida.'

  formErrors.value = errors
  if (Object.keys(errors).length)
    return

  setLoading(true)

  try {
    const dados: IManutStatusOrdemServico = {
      ...(selectStatus.value !== null ? { cn_status: selectStatus.value } : {}),
      an_descr: values.an_descr.trim(),
      ca_cor: values.ca_cor,
      bo_padrao: values.bo_padrao,
    }
    const resultado = await saveStatus(dados)
    emit('saved', resultado)
    toast.success('Processo realizado com sucesso.')
    emit('update:visible', false)
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(selectStatus, loadStatus)
watch(() => props.visible, visible => {
  if (visible)
    newStatus()
}, { immediate: true })
</script>

<template>
  <CadastroDialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar status da O.S.' : 'Novo status da O.S.'"
    width="48rem"
    @submit="formRef?.submit()"
  >
    <div class="flex gap-2 mb-4">
      <Select
        v-model="selectStatus"
        :options="status"
        optionLabel="an_descr"
        optionValue="cn_status"
        placeholder="Selecionar um status para editar"
        aria-label="Selecionar status para editar"
        class="flex-1 min-w-0"
        showClear
      />
      <Button
        type="button"
        label="Novo"
        icon="pi pi-plus"
        severity="secondary"
        @click="newStatus"
      />
    </div>
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit(formData)"
    >
      <Fieldset legend="Dados do status">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="col-span-12 sm:col-span-9" name="an_descr" label="Nome *" v-slot="{ invalid, field }">
            <InputText v-model="formData.an_descr" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-3" name="ca_cor" label="Cor *" v-slot="{ invalid, field }">
            <InputText
              v-model="formData.ca_cor"
              :name="field"
              type="color"
              :invalid="invalid"
              fluid
              class="h-10"
              aria-label="Cor do status"
            />
          </FieldForm>
          <FieldForm class="col-span-12" name="bo_padrao" label="Padrão para novas ordens" v-slot="{ field }">
            <ToggleSwitch v-model="formData.bo_padrao" :name="field" aria-label="Usar como status padrão em novas ordens" />
          </FieldForm>
          <div class="col-span-12 mt-2">
            <span class="inline-flex rounded-full px-3 py-1 font-semibold" :style="{ backgroundColor: formData.ca_cor, color: corTextoStatus(formData.ca_cor) }">{{ formData.an_descr || 'Prévia do status' }}</span>
          </div>
        </div>
      </Fieldset>
    </FormPage>
  </CadastroDialog>
</template>
