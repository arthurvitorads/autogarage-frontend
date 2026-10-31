<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'

import CadastroDialog from '@/components/dialogs/CadastroDialog.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type { IFormClassificacaoOrdemServico, IManutClassificacaoOrdemServico, IClassificacaoOrdemServico, TCodigoOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'
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
  saved: [classificacoes: IClassificacaoOrdemServico]
}>()

const ordemStore = useOrdemServicoStore()
const { classificacoes } = storeToRefs(ordemStore)
const { saveClassificacao } = ordemStore
const { normalizeError, setLoading } = useUtilStore()
const toast = useAppToast()
const selectClassificacao = ref<TCodigoOrdemServico | null>(null)
const isEditing = computed(() => selectClassificacao.value !== null)
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<{
  submit: () => void
} | null>(null)

function formDataDefault(): IFormClassificacaoOrdemServico {
  return {
    an_descr: '',
    ca_cor: '#64748b',
    bo_padrao: classificacoes.value.length === 0,
  }
}

const formData = ref<IFormClassificacaoOrdemServico>(formDataDefault())

function loadClassificacao() {
  const selecionado = classificacoes.value.find(item => item.cn_classificacao === selectClassificacao.value)

  formData.value = selecionado ? {
    an_descr: selecionado.an_descr,
    ca_cor: selecionado.ca_cor,
    bo_padrao: selecionado.bo_padrao,
  } : formDataDefault()
  formErrors.value = {}
  formKey.value++
}

function newClassificacao() {
  selectClassificacao.value = null
  loadClassificacao()
}

async function onSubmit(values: IFormClassificacaoOrdemServico) {
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
    const dados: IManutClassificacaoOrdemServico = {
      ...(selectClassificacao.value !== null ? { cn_classificacao: selectClassificacao.value } : {}),
      an_descr: values.an_descr.trim(),
      ca_cor: values.ca_cor,
      bo_padrao: values.bo_padrao,
    }
    const resultado = await saveClassificacao(dados)
    emit('saved', resultado)
    toast.success('Processo realizado com sucesso.')
    emit('update:visible', false)
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(selectClassificacao, loadClassificacao)
watch(() => props.visible, async visible => {
  if (visible) {
    try {
      await ordemStore.loadParametros()
      newClassificacao()
    } catch (error) {
      toast.error(normalizeError(error))
    }
  }
}, { immediate: true })
</script>

<template>
  <CadastroDialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Classificações da O.S.' : 'Classificações da O.S.'"
    width="48rem"
    @submit="formRef?.submit()"
  >
    <div class="flex justify-end mb-3"><Button label="Novo" icon="pi pi-plus" @click="newClassificacao" /></div>
    <DataTable :value="classificacoes" size="small" scrollable scrollHeight="14rem" class="mb-4">
      <Column header="Ações"><template #body="{ data }"><Button icon="pi pi-pencil" severity="secondary" text aria-label="Editar classificação" @click="selectClassificacao = data.cn_classificacao" /></template></Column>
      <Column field="an_descr" header="Descrição" />
      <Column header="Cor"><template #body="{ data }"><span class="inline-block w-5 h-5 rounded" :style="{ background: data.ca_cor }"></span></template></Column>
      <Column header="Padrão"><template #body="{ data }">{{ data.bo_padrao ? 'Sim' : 'Não' }}</template></Column>
      <template #empty>Nenhuma classificação disponível.</template>
    </DataTable>
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit(formData)"
    >
      <Fieldset legend="Dados da classificação">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="col-span-12 sm:col-span-9" name="an_descr" label="Nome *" v-slot="{ invalid, field }">
            <InputText maxlength="4000" v-model="formData.an_descr" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-3" name="ca_cor" label="Cor *" v-slot="{ invalid, field }">
            <InputText maxlength="4000"
              v-model="formData.ca_cor"
              :name="field"
              type="color"
              :invalid="invalid"
              fluid
              class="h-10"
              aria-label="Cor da classificação"
            />
          </FieldForm>
          <FieldForm class="col-span-12" name="bo_padrao" label="Padrão para novas ordens" v-slot="{ field }">
            <ToggleSwitch v-model="formData.bo_padrao" :name="field" aria-label="Usar como classificação padrão em novas ordens" />
          </FieldForm>
          <div class="col-span-12 mt-2">
            <span class="inline-flex rounded-full px-3 py-1 font-semibold" :style="{ backgroundColor: formData.ca_cor, color: corTextoStatus(formData.ca_cor) }">{{ formData.an_descr || 'Prévia da classificação' }}</span>
          </div>
        </div>
      </Fieldset>
    </FormPage>
  </CadastroDialog>
</template>
