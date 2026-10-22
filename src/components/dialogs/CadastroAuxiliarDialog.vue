<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'

import CadastroDialog from '@/components/dialogs/CadastroDialog.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type { IAdmCadastroAuxiliar, IFormCadastroAuxiliar, TTipoCadastroAuxiliar } from '@/interface/interface-pages/CadastroAuxiliar'
import type { TGenericData } from '@/interface/util'

import { useCatalogoStore } from '@/stores/catalogo.store'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'

const props = defineProps<{
  visible: boolean
  tipo: TTipoCadastroAuxiliar
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [cadastro: IAdmCadastroAuxiliar]
}>()

const { saveCadastroAuxiliar } = useCatalogoStore()
const { normalizeError, setLoading } = useUtilStore()
const toast = useAppToast()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<{ submit: () => void } | null>(null)
const header = computed(() => props.tipo === 'MARCA' ? 'Nova marca'
  : props.tipo === 'UNIDADE' ? 'Nova unidade' : 'Nova categoria')

function formDataDefault(): IFormCadastroAuxiliar {
  return {
    an_descr: '',
    ca_sigla: '',
  }
}

const formData = ref<IFormCadastroAuxiliar>(formDataDefault())

function onSubmit(values: IFormCadastroAuxiliar) {
  const errors: TGenericData = {}

  if (!values.an_descr.trim()) errors.an_descr = 'Campo obrigatório.'

  if (props.tipo === 'UNIDADE' && !/^[A-Z0-9]{1,10}$/.test(values.ca_sigla.trim().toUpperCase()))
    errors.ca_sigla = 'Informe uma sigla com até 10 letras ou números.'

  formErrors.value = errors

  if (Object.keys(errors).length) return

  setLoading(true)

  try {
    const dados = {
      ca_tipo: props.tipo,
      an_descr: values.an_descr.trim(),
      ca_sigla: props.tipo === 'UNIDADE' ? values.ca_sigla.trim().toUpperCase() : '',
    }
    const cadastro = saveCadastroAuxiliar(dados)

    console.log(JSON.stringify(dados, null, 2))
    emit('saved', cadastro)
    toast.success('Cadastro registrado nesta sessão. JSON gerado no console.')
    emit('update:visible', false)
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch([() => props.visible, () => props.tipo], ([visible]) => {
  if (!visible) return

  formData.value = formDataDefault()
  formErrors.value = {}
  formKey.value++
}, { immediate: true })
</script>

<template>
  <CadastroDialog :visible="visible" @update:visible="emit('update:visible', $event)"
    :header="header" width="42rem" @submit="formRef?.submit()">
    <FormPage ref="formRef" :key="formKey" novalidate class="flex flex-col gap-4"
      v-model:errors="formErrors" :initialValues="formData" @submit="onSubmit(formData)">
      <Fieldset :legend="tipo === 'UNIDADE' ? 'Dados da unidade' : tipo === 'MARCA' ? 'Dados da marca' : 'Dados da categoria'">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm :class="tipo === 'UNIDADE' ? 'col-span-12 sm:col-span-8' : 'col-span-12'"
            name="an_descr" label="Descrição *" v-slot="{ invalid, field }">
            <InputText v-model="formData.an_descr" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm v-if="tipo === 'UNIDADE'" class="col-span-12 sm:col-span-4" name="ca_sigla" label="Sigla *" v-slot="{ invalid, field }">
            <InputText v-model="formData.ca_sigla" :name="field" :invalid="invalid" maxlength="10" fluid />
          </FieldForm>
        </div>
      </Fieldset>
    </FormPage>
  </CadastroDialog>
</template>
