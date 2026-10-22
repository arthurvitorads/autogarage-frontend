<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'

import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type { IAdmPerfil, IFormPerfil } from '@/interface/interface-pages/PerfilPage'
import type { TGenericData } from '@/interface/util'

import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { createPerfil, updatePerfil } from '@/services/perfil.service'

const props = defineProps<{
  visible: boolean
  perfil?: IAdmPerfil | null
}>()

const emit = defineEmits<{ 
  'update:visible': [visible: boolean]
  saved: []
}>()

const toast = useAppToast()

const { normalizeError, setLoading } = useUtilStore()

const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const isValidated = ref(false)

const isEditing = computed(() => !!props.perfil)

function formDataDefault(): IFormPerfil {
  return {
    an_descr: '',
    bo_sts_reg: true
  }
}

const formData = ref<IFormPerfil>(formDataDefault())

async function onSubmit(values: IFormPerfil) {
  setLoading(true)

  const errors: TGenericData = {}

  if (!values.an_descr?.trim()) 
    errors.an_descr = 'Campo obrigatório.'
  
  formErrors.value = errors
  isValidated.value = !Object.keys(errors).length

  if (!isValidated.value) 
    return setLoading(false)

  try {
    if (isEditing.value) {
      const id = props.perfil?.cn_perfil

      if (id === undefined) 
        throw new Error('Identificador do usuário inválido.')
      
      await updatePerfil(id, { an_descr: values.an_descr, bo_sts_reg: values.bo_sts_reg })
    } else {
      await createPerfil(values)
    }
    toast.success('Processo realizado com sucesso.')

    emit('update:visible', false)
    emit('saved')
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch([() => props.visible, () => props.perfil], ([visible]) => {
  if (!visible) return

  formData.value = props.perfil ? {
    an_descr: props.perfil.an_descr ?? '',
    bo_sts_reg: props.perfil.bo_sts_reg ?? true,
  } : formDataDefault()
  
  formErrors.value = {}
  isValidated.value = false
  formKey.value++
}, { immediate: true })

</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar perfil' : 'Novo perfil'"
    modal
    class="w-140"
  >
    <FormPage
      class="grid gap-x-2 grid-cols-12"
      :key="formKey"
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit"
      @input="isValidated = false"
      @change="isValidated = false"
    >
      <FieldForm class="col-span-10" name="an_descr" label="Descrição" v-slot="{ invalid, field }">
        <InputText :name="field" placeholder="Digite a descrição" :invalid="invalid" fluid />
      </FieldForm>
      <FieldForm class="flex justify-center ml-2" name="bo_sts_reg" label="Status" v-slot="{ field }">
        <ToggleSwitch :name="field"/>
      </FieldForm>
      <div class="col-span-12 flex justify-end gap-2 mt-4">
        <Button type="button" label="Cancelar" severity="secondary" @click="emit('update:visible', false)" />
        <Button type="submit" label="Gravar" />
      </div>
    </FormPage>
  </Dialog>
</template>
