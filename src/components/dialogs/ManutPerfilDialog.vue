<script setup lang="ts">
import { ProfileModel } from '@/models/profile.model'
import type { IManutProfileDialogProps } from '@/interface/dialog'
import { computed, ref, watch } from 'vue'

import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import StatusField from '@/components/field/StatusField.vue'
import Button from 'primevue/button'

import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type { IAdmPerfil, IFormProfile } from '@/interface/interface-pages/PerfilPage'
import type { TGenericData } from '@/interface/util'

import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { createProfile, updateProfile } from '@/services/perfil.service'

const props = defineProps<IManutProfileDialogProps>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: []
}>()

const { showSuccess, showError } = useAppToast()

const { normalizeError, setLoading } = useUtilStore()

const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const isValidated = ref(false)

const isEditing = computed(() => !!props.profile)

const formData = ref<IFormProfile>(ProfileModel.createForm())

async function onSubmit(values: IFormProfile) {
  setLoading(true)

  const errors: TGenericData = {}

  if (!values.an_descr?.trim()) errors.an_descr = 'Campo obrigatório.'

  formErrors.value = errors
  isValidated.value = !Object.keys(errors).length

  if (!isValidated.value) return setLoading(false)

  try {
    if (isEditing.value) {
      const id = props.profile?.cn_perfil

      if (id === undefined) throw new Error('Identificador do usuário inválido.')

      await updateProfile(id, { an_descr: values.an_descr, bo_sts_reg: values.bo_sts_reg })
    } else {
      await createProfile(values)
    }
    showSuccess('Processo realizado com sucesso.')

    emit('update:visible', false)
    emit('saved')
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(
  [() => props.visible, () => props.profile],
  ([visible]) => {
    if (!visible) return

    formData.value = props.profile
      ? {
          an_descr: props.profile.an_descr ?? '',
          bo_sts_reg: props.profile.bo_sts_reg ?? true,
        }
      : ProfileModel.createForm()

    formErrors.value = {}
    isValidated.value = false
    formKey.value++
  },
  { immediate: true },
)
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
      @submit="onSubmit({ ...$event, bo_sts_reg: formData.bo_sts_reg })"
      @input="isValidated = false"
      @change="isValidated = false"
    >
      <FieldForm class="col-span-8" name="an_descr" label="Descrição" v-slot="{ invalid, field }">
        <InputText
          maxlength="4000"
          :name="field"
          placeholder="Digite a descrição"
          :invalid="invalid"
          fluid
        />
      </FieldForm>
      <FieldForm class="col-span-4 flex items-start ml-2" name="bo_sts_reg" label="Status">
        <StatusField v-model="formData.bo_sts_reg" />
      </FieldForm>
      <div class="col-span-12 flex justify-end gap-2 mt-4">
        <Button
          type="button"
          label="Cancelar"
          severity="secondary"
          @click="emit('update:visible', false)"
        />
        <Button type="submit" label="Gravar" />
      </div>
    </FormPage>
  </Dialog>
</template>
