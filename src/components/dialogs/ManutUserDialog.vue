<script setup lang="ts">
import FloatLabel from 'primevue/floatlabel'
import { UserModel } from '@/models/user.model'
import type { IFormPageRef } from '@/interface/util'
import type { IManutUsuarioDialogProps } from '@/interface/pages/UsuarioPage'
import { computed, reactive, ref, watch } from 'vue'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import StatusField from '@/components/field/StatusField.vue'

import { storeToRefs } from 'pinia'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import FormPage from '@/components/pages/FormPage.vue'
import config from '@/config/UsuarioPageConfig.json'
import FieldForm from '@/components/field/FieldForm.vue'

import type { IFormUsuario } from '@/interface/pages/UsuarioPage'
import type { TGenericData } from '@/interface/util'

import { createUser, updateUser } from '@/services/user.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import DomainField from '../field/DomainField.vue'

const props = defineProps<IManutUsuarioDialogProps>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: []
}>()

const { showSuccess, showError } = useAppToast()

const { normalizeError, setLoading } = useUtilStore()
const { loading } = storeToRefs(useUtilStore())

const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)

const isEditing = computed(() => !!props.user)

const formData = reactive<IFormUsuario>(UserModel.createForm())

async function onSubmit(values: IFormUsuario) {
  setLoading(true)

  try {
    if (isEditing.value) {
      const id = props.user?.cn_usuario

      if (id === undefined) throw new Error('Identificador do usuário inválido.')

      await updateUser(id, {
        an_nome: values.an_nome,
        bo_sts_reg: values.bo_sts_reg,
        cn_perfil: values.cn_perfil,
      })
    } else {
      await createUser(values)
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
  [() => props.visible, () => props.user],
  ([visible]) => {
    if (!visible) return

    const user = props.user

    Object.assign(formData, UserModel.createForm())
    if (user) {
      Object.assign(formData, {
        an_nome: user.an_nome ?? '',
        an_email: user.an_email ?? '',
        ca_senha: '',
        cn_perfil: user.cn_perfil ?? null,
        bo_sts_reg: user.bo_sts_reg ?? true,
      })
    }
    formErrors.value = {}
    formKey.value++
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar usuário' : 'Novo usuário'"
    modal
    :style="{ width: '64rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      class="flex flex-col gap-4"
      v-model:errors="formErrors"
      :initialValues="formData"
      :modelValues="formData"
      :fields="isEditing ? config.fields : { ...config.fields, ...config.createFields }"
      @submit="onSubmit"
    >
      <Fieldset legend="Usuário">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-10"
            name="an_nome"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                id="ManutUserDialog-an_nome"
                v-model="formData.an_nome"
                maxlength="4000"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label for="ManutUserDialog-an_nome">Nome</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-2" name="bo_sts_reg">
            <StatusField v-model="formData.bo_sts_reg" />
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6"
            name="an_email"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                id="ManutUserDialog-an_email"
                v-model="formData.an_email"
                maxlength="4000"
                :name="field"
                type="email"
                :invalid="invalid"
                fluid
                :readonly="isEditing"
              />
              <label for="ManutUserDialog-an_email">E-mail</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6"
            name="cn_perfil"
            label="Perfil"
            v-slot="{ invalid, field }"
          >
            <DomainField
              v-model="formData.cn_perfil"
              :name="field"
              endpoint="/perfil/domain"
              :invalid="invalid"
            />
          </FieldForm>
          <FieldForm
            v-if="!isEditing"
            class="m-[4px] col-span-12"
            name="ca_senha"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <Password
                inputId="ManutUserDialog-ca_senha"
                v-model="formData.ca_senha"
                :inputProps="{ maxlength: 128 }"
                :name="field"
                :feedback="false"
                toggleMask
                fluid
                autocomplete="new-password"
                :invalid="invalid"
              />
              <label for="ManutUserDialog-ca_senha">{{
                isEditing ? 'Nova senha (opcional)' : 'Senha'
              }}</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </Fieldset>
    </FormPage>
    <template #footer>
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
