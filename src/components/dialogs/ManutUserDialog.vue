<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import ToggleSwitch from 'primevue/toggleswitch'

import CadastroDialog from '@/components/dialogs/CadastroDialog.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type { IAdmUsuario, IFormUsuario } from '@/interface/interface-pages/UsuarioPage'
import type { TGenericData } from '@/interface/util'

import { validateEmail } from '@/services/util.service'
import { createUser, updateUser } from '@/services/user.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import DomainField from '../field/DomainField.vue'

const props = defineProps<{
  visible: boolean
  user?: IAdmUsuario | null
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: []
}>()

const toast = useAppToast()

const { normalizeError, setLoading } = useUtilStore()

const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<{
  submit: () => void
} | null>(null)
const isValidated = ref(false)

const isEditing = computed(() => !!props.user)

function formDataDefault(): IFormUsuario {
  return {
    an_nome: '',
    an_email: '',
    ca_senha: '',
    cn_perfil: null,
    bo_sts_reg: true
  }
}

const formData = ref<IFormUsuario>(formDataDefault())

async function onSubmit(values: IFormUsuario) {
  setLoading(true)

  const errors: TGenericData = {}

  if (!values.an_nome?.trim())
    errors.an_nome = 'Campo obrigatório.'

  if (!isEditing.value && !values.an_email?.trim())
    errors.an_email = 'Campo obrigatório.'

  else if (!isEditing.value && !validateEmail(values.an_email.trim()))
    errors.an_email = 'Informe um e-mail válido.'

  if (!isEditing.value && !values.ca_senha)
    errors.ca_senha = 'Campo obrigatório.'
  else if (!isEditing.value && (values.ca_senha.length < 6 || values.ca_senha.length > 128))
    errors.ca_senha = 'A senha deve conter entre 6 e 128 caracteres.'

  formErrors.value = errors
  isValidated.value = !Object.keys(errors).length

  if (!isValidated.value)
    return setLoading(false)

  try {
    if (isEditing.value) {
      const id = props.user?.cn_usuario

      if (id === undefined)
        throw new Error('Identificador do usuário inválido.')

      await updateUser(id, {
        an_nome: values.an_nome,
        bo_sts_reg: values.bo_sts_reg,
        cn_perfil: formData.value.cn_perfil
      })
    } else {
      await createUser({ ...values, cn_perfil: formData.value.cn_perfil })
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

watch([() => props.visible, () => props.user], ([visible]) => {
  if (!visible)
    return

  const user = props.user

  formData.value = user ? {
    an_nome: user.an_nome ?? '',
    an_email: user.an_email ?? '',
    ca_senha: '',
    cn_perfil: user.cn_perfil ?? null,
    bo_sts_reg: user.bo_sts_reg ?? true,
  } : formDataDefault()
  formErrors.value = {}
  isValidated.value = false
  formKey.value++
}, { immediate: true })
</script>

<template>
  <CadastroDialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar usuário' : 'Novo usuário'"
    width="64rem"
    @submit="formRef?.submit()"
  >
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      class="flex flex-col gap-4"
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit"
      @input="isValidated = false"
      @change="isValidated = false"
    >
      <Fieldset legend="Usuário">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="col-span-12 sm:col-span-10" name="an_nome" label="Nome" v-slot="{ invalid, field }">
            <InputText :name="field" placeholder="Digite o nome" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-2" name="bo_sts_reg" label="Status" v-slot="{ field }">
            <ToggleSwitch :name="field" />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-6" name="an_email" label="E-mail" v-slot="{ invalid, field }">
            <InputText
              :name="field"
              type="email"
              placeholder="Digite o e-mail"
              :invalid="invalid"
              fluid
              :readonly="isEditing"
            />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-6" name="cn_perfil" label="Perfil" v-slot="{ invalid, field }">
            <DomainField
              v-model="formData.cn_perfil"
              :name="field"
              endpoint="/paramPerfil"
              optionsPath="dados.perfil"
              :invalid="invalid"
            />
          </FieldForm>
          <FieldForm
            v-if="!isEditing"
            class="col-span-12"
            name="ca_senha"
            :label="isEditing ? 'Nova senha (opcional)' : 'Senha'"
            v-slot="{ invalid, field }"
          >
            <Password
              :name="field"
              placeholder="Digite a senha"
              :feedback="false"
              toggleMask
              fluid
              autocomplete="new-password"
              :invalid="invalid"
            />
          </FieldForm>
        </div>
      </Fieldset>
    </FormPage>
  </CadastroDialog>
</template>
