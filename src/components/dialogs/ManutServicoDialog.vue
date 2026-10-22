<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'

import CadastroDialog from '@/components/dialogs/CadastroDialog.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'
import CadastroAuxiliarDialog from '@/components/dialogs/CadastroAuxiliarDialog.vue'

import type { IAdmServico, IFormServico, IManutServico } from '@/interface/interface-pages/ServicoPage'
import type { IAdmCadastroAuxiliar } from '@/interface/interface-pages/CadastroAuxiliar'
import type { TGenericData } from '@/interface/util'

import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { useCatalogoStore } from '@/stores/catalogo.store'

const props = defineProps<{
  visible: boolean
  servico?: IAdmServico | null
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [servico: IManutServico]
}>()

const toast = useAppToast()
const catalogoStore = useCatalogoStore()
const { saveServico } = catalogoStore
const { categoriasServico } = storeToRefs(catalogoStore)
const cadastroCategoriaVisible = ref(false)

function selectCategoria(cadastro: IAdmCadastroAuxiliar) {
  formData.value.an_categoria = cadastro.an_descr
  delete formErrors.value.an_categoria
}
const { normalizeError, setLoading } = useUtilStore()

const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<{ submit: () => void } | null>(null)
const isValidated = ref(false)
const isEditing = computed(() => !!props.servico)

function formDataDefault(): IFormServico {
  return {
    an_nome: '',
    an_categoria: null,
    vl_preco: 0,
    nu_tempo_estimado: null,
    an_obs: '',
    bo_sts_reg: true,
  }
}

const formData = ref<IFormServico>(formDataDefault())

function onSubmit(values: IFormServico) {
  const errors: TGenericData = {}

  if (!values.an_nome.trim())
    errors.an_nome = 'Campo obrigatório.'

  if (values.an_categoria && !categoriasServico.value.includes(values.an_categoria))
    errors.an_categoria = 'Selecione uma categoria.'

  if (values.vl_preco === null || !Number.isFinite(values.vl_preco) || values.vl_preco < 0 ||
    values.vl_preco > 999_999_999.99 || Math.abs(values.vl_preco * 100 - Math.round(values.vl_preco * 100)) > 0.000001)
    errors.vl_preco = 'Informe um preço válido, com até duas casas decimais.'

  if (values.nu_tempo_estimado !== null && (
    !Number.isSafeInteger(values.nu_tempo_estimado) ||
    values.nu_tempo_estimado < 1 || values.nu_tempo_estimado > 999999
  ))
    errors.nu_tempo_estimado = 'Informe o tempo em minutos inteiros, maior que zero.'

  formErrors.value = errors
  isValidated.value = !Object.keys(errors).length

  if (!isValidated.value) return

  setLoading(true)

  try {
    const servico: IManutServico = {
      ...(props.servico ? { cn_servico: props.servico.cn_servico } : {}),
      an_nome: values.an_nome.trim(),
      an_categoria: values.an_categoria ?? '',
      vl_preco: values.vl_preco ?? 0,
      ...(values.nu_tempo_estimado !== null ? { nu_tempo_estimado: values.nu_tempo_estimado } : {}),
      an_obs: values.an_obs.trim(),
      bo_sts_reg: values.bo_sts_reg,
    }

    saveServico(servico)
    console.log(JSON.stringify(servico, null, 2))
    emit('saved', servico)
    toast.success('Serviço registrado nesta tela. JSON gerado no console.')
    emit('update:visible', false)
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch([() => props.visible, () => props.servico], ([visible]) => {
  if (!visible) return

  const servico = props.servico

  formData.value = servico ? {
    an_nome: servico.an_nome,
    an_categoria: servico.an_categoria,
    vl_preco: servico.vl_preco,
    nu_tempo_estimado: servico.nu_tempo_estimado ?? null,
    an_obs: servico.an_obs,
    bo_sts_reg: servico.bo_sts_reg,
  } : formDataDefault()

  formErrors.value = {}
  isValidated.value = false
  formKey.value++
}, { immediate: true })
</script>

<template>
  <CadastroDialog :visible="visible" @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar serviço' : 'Novo serviço'" width="72rem" @submit="formRef?.submit()">
    <FormPage ref="formRef" :key="formKey" novalidate class="flex flex-col gap-4"
      v-model:errors="formErrors" :initialValues="formData" @submit="onSubmit(formData)"
      @input="isValidated = false" @change="isValidated = false">
      <Fieldset legend="Dados principais">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="col-span-12 sm:col-span-10" name="an_nome" label="Nome *" v-slot="{ invalid, field }">
            <InputText v-model="formData.an_nome" :name="field" :invalid="invalid" fluid placeholder="Digite o nome do serviço" />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-2" name="bo_sts_reg" label="Status" v-slot="{ field }">
            <ToggleSwitch v-model="formData.bo_sts_reg" :name="field" aria-label="Serviço ativo" />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-6 lg:col-span-4" name="an_categoria" label="Categoria" v-slot="{ invalid, field }">
            <div class="flex gap-2">
              <Select v-model="formData.an_categoria" :name="field" :options="categoriasServico" :invalid="invalid"
                class="flex-1 min-w-0" placeholder="Selecione a categoria" showClear />
              <Button type="button" icon="pi pi-plus" severity="secondary" aria-label="Cadastrar categoria" @click="cadastroCategoriaVisible = true" />
            </div>
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-6 lg:col-span-4" name="vl_preco" label="Preço do serviço *" v-slot="{ invalid, field }">
            <InputNumber v-model="formData.vl_preco" :name="field" :invalid="invalid" fluid locale="pt-BR"
              mode="currency" currency="BRL" :max="999999999.99" :min="0" />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-6 lg:col-span-4" name="nu_tempo_estimado" label="Tempo estimado (minutos)" v-slot="{ invalid, field }">
            <InputNumber v-model="formData.nu_tempo_estimado" :name="field" :invalid="invalid" fluid locale="pt-BR"
              :max="999999" :min="0" :maxFractionDigits="0" placeholder="Opcional" />
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset legend="Observações">
        <FieldForm name="an_obs" v-slot="{ field }">
          <Textarea v-model="formData.an_obs" :name="field" rows="2" fluid />
        </FieldForm>
      </Fieldset>
    </FormPage>
  </CadastroDialog>
  <CadastroAuxiliarDialog v-model:visible="cadastroCategoriaVisible" tipo="CATEGORIA_SERVICO" @saved="selectCategoria" />
</template>
