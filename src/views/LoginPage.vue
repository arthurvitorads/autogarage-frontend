<script setup lang="ts">
import logoClara from '../assets/img/logo_clara.png'

import Panel from 'primevue/panel'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

import { reactive, ref } from 'vue'

import { useAppToast } from '@/services/toast.service'

import { useUtilStore } from '@/stores/util.store'

import { IFormLogin } from '@/interface/interface-pages/LoginPage'

import { TGenericData } from '@/interface/util'

import FieldForm from '@/components/field/FieldForm.vue'
import FormPage from '@/components/pages/FormPage.vue'
import { login } from '@/services/auth.service'
import { useRouter } from 'vue-router'

const utilStore = useUtilStore();

const router = useRouter();

const toastService = useAppToast();

function formDataDefault(): IFormLogin {
  return {
    an_email: '',
    ca_senha: '',
  }
}

const formData = reactive<IFormLogin>(formDataDefault())

const formErros = ref<TGenericData>({})

async function onSubmit(values: IFormLogin) {

  if (!values.an_email) 
    formErros.value.an_email = 'Informe o e-mail.'
  if (!values.ca_senha) 
    formErros.value.ca_senha = 'Informe a senha.'

  if (Object.keys(formErros.value).length) 
    return

  utilStore.setLoading(true)
  try {
    await login(values)
    await router.push('/')
  } catch (error) {
    toastService.warn((error as Error).message)
  } finally {
    utilStore.setLoading(false)
  }
}

</script>

<template>
  <div class="flex min-h-screen">
    <div class="w-1/2 flex items-center justify-center bg-neutral-900">
      <img class="w-150" :src="logoClara" alt="Logo do AutoGarage">
    </div>

    <div class="w-1/2 flex flex-col items-center justify-center bg-purple-50">
      <Panel>
        <template #header>
          <div class="flex flex-col">
            <span class="font-bold text-xl">Bem vindo de volta!</span>
            <span class="text-xs">Acesse o sistema utilizando seu e-mail e senha.</span>
          </div>
        </template>

        <FormPage 
          class="flex flex-col w-100" 
          v-model:errors="formErros" 
          :initialValues="formData"
          @submit="onSubmit"
        >
          <FieldForm name="an_email" label="E-mail" v-slot="{ invalid, field }">
            <InputText 
              :name="field" 
              placeholder="Digite seu e-mail" 
              :invalid="invalid" 
            />
          </FieldForm>

          <FieldForm name="ca_senha" label="Senha" v-slot="{ invalid, field }">
            <Password 
              :name="field" 
              placeholder="Digite sua senha" 
              :feedback="false" 
              toggleMask 
              fluid
              :invalid="invalid" 
            />
          </FieldForm>

          <Button type="submit" label="Entrar" icon="pi pi-arrow-right" />
        </FormPage>
      </Panel>

      <div class="absolute bottom-6 text-xs text-stone-400">
        © 2026 AutoGarage. Todos os direitos reservados.
      </div>
    </div>
  </div>
</template>
