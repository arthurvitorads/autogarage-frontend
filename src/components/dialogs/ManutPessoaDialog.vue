<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import Dialog from 'primevue/dialog'
import Fieldset from 'primevue/fieldset'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Button from 'primevue/button'

import StatusField from '@/components/field/StatusField.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import { PersonModel } from '@/models/person.model'

import { personCategories, type IManutPessoa, type IManutPessoaDialogProps } from '@/interface/pages/PessoaPage'
import type { IFormPessoa, TPersonCategory } from '@/interface/pages/PessoaPage'

import type { IEndEstado } from '@/interface/tables'

import { createPerson, updatePerson } from '@/services/person.service'
import { getStates } from '@/services/address.service'
import { fetchCep } from '@/services/cep.service'
import { fetchCnpj } from '@/services/documento.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'

import { useConfirmacao as useConfirmation } from '@/composables/useConfirmacao'

import {
  validateCPF,
  validateCNPJ,
  validateEmail,
  onlyNumbers,
  unMaskDocument,
  maskCpf,
  maskCnpj,
  maskCep,
  maskPersonPhone,
} from '@/services/util.service'

import type { IFormPageRef } from '@/interface/util'
import type { TGenericData } from '@/interface/util'

import { personTypes } from '@/interface/enum'
import config from '@/config/PessoaPageConfig.json'

const props = defineProps<IManutPessoaDialogProps>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: []
}>()

const { showError, showWarn, showSuccess } = useAppToast()
const { normalizeError, setLoading } = useUtilStore()

const confirmAction = useConfirmation()

const formData = ref<IFormPessoa>(PersonModel.createForm())

const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)

const loadingButton = ref(false)
const estadosData = ref<IEndEstado[]>([])

const isEditing = computed(() => !!props.person)

const selectedCategories = computed({
  get: () =>
    personCategories.filter(({ value }) => formData.value[value]).map(({ value }) => value),
  set: (values: TPersonCategory[]) => {
    for (const { value } of personCategories) formData.value[value] = values.includes(value)
  },
})

function handleEstado(uf: string) {
  return estadosData.value.find((e) => e.ca_uf === uf.trim().toUpperCase())?.cn_estado ?? ''
}

async function loadEstados() {
  estadosData.value = []

  try {
    estadosData.value = await getStates()

    if (!estadosData.value.length)
      showError('Nenhuma UF foi cadastrada.')
  } catch (error) {
    showError(normalizeError(error))
  }
}

async function handleCnpj() {
  const cnpj = unMaskDocument(formData.value.ca_cnpj).toUpperCase()

  if (!validateCNPJ(cnpj))
    return formErrors.value.ca_cnpj = 'Informe um CNPJ válido.'

  setLoading(true)

  try {
    const response = await fetchCnpj(cnpj)

    if (!response) {
      formErrors.value.ca_cnpj = 'Não foi encontrado nenhum cadastro para este CNPJ.'
      showWarn(formErrors.value.ca_cnpj)
      return
    }

    formData.value.an_razao_social = response.an_razao_social
    formData.value.an_nome_fantasia = response.an_nome_fantasia
    formData.value.an_email = response.an_email
    formData.value.an_telefone = response.an_telefone ?? ''
    formData.value.ca_cep = maskCep(response.ca_cep)
    formData.value.an_logradouro = response.an_logradouro
    formData.value.an_numero = response.an_numero
    formData.value.an_complemento = response.an_complemento
    formData.value.an_bairro = response.an_bairro
    formData.value.an_cidade = response.an_cidade
    formData.value.cn_estado = handleEstado(response.ca_uf)

    formErrors.value = {}

    showSuccess('Processo realizado com sucesso.')
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

async function handleCep() {
  const cep = formData.value.ca_cep.replace(/\D/g, '')

  if (cep.length !== 8) {
    formErrors.value.ca_cep = 'Informe um CEP com 8 dígitos.'
    return
  }

  setLoading(true)

  try {
    const response = await fetchCep(cep)

    formErrors.value = {}

    formData.value.an_logradouro = response.an_logradouro
    formData.value.an_bairro = response.an_bairro
    formData.value.an_cidade = response.an_cidade
    formData.value.cn_estado = handleEstado(response.ca_uf) || formData.value.cn_estado

    showSuccess('Processo realizado com sucesso.')
  } catch (error) {
    showWarn(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

async function onSubmit(values: IFormPessoa) {
  const errors: TGenericData = {}

  if (values.ca_tipo === 'PF') {
    if (!validateCPF(values.ca_cpf)) errors.ca_cpf = 'Informe um CPF válido.'
  } else {
    if (!validateCNPJ(values.ca_cnpj)) errors.ca_cnpj = 'Informe um CNPJ válido.'
  }

  if (!validateEmail(values.an_email.trim())) errors.an_email = 'Informe um e-mail válido.'

  if (
    !/^[0-9 ()+.-]+$/.test(values.an_telefone) ||
    ![10, 11].includes(onlyNumbers(values.an_telefone).length)
  )
    errors.an_telefone = 'Informe um telefone com DDD (10 ou 11 dígitos).'

  if (!/^\d{5}-?\d{3}$/.test(values.ca_cep.trim())) errors.ca_cep = 'Informe um CEP válido.'

  if (
    values.bo_categ_func &&
    (values.nm_comissao_func === null ||
      !Number.isFinite(values.nm_comissao_func) ||
      values.nm_comissao_func < 0 ||
      values.nm_comissao_func > 100)
  )
    errors.nm_comissao_func = 'A comissão deve estar entre 0% e 100%.'

  const document = unMaskDocument(values.ca_tipo === 'PF' ? values.ca_cpf : values.ca_cnpj).toUpperCase()
  const duplicateDocument = (props.people ?? []).some(
    (person) =>
      person !== props.person &&
      (props.person?.cn_pessoa === undefined || person.cn_pessoa !== props.person.cn_pessoa) &&
      unMaskDocument((person.ca_tipo === 'PF' ? person.ca_cpf : person.ca_cnpj) ?? '').toUpperCase() === document,
  )

  if (duplicateDocument) errors[values.ca_tipo === 'PF' ? 'ca_cpf' : 'ca_cnpj'] = 'Documento já cadastrado.'

  formErrors.value = errors
  if (Object.keys(errors).length) return

  if (!(await confirmAction())) return

  setLoading(true)

  try {
    const fisica = values.ca_tipo === 'PF'
    const person: IManutPessoa = {
      ca_tipo: values.ca_tipo,
      an_nome: fisica ? values.an_nome.trim() : null,
      ca_cpf: fisica ? document : null,
      ca_cnpj: fisica ? null : document,
      an_razao_social: fisica ? null : values.an_razao_social.trim(),
      an_nome_fantasia: fisica ? null : values.an_nome_fantasia.trim(),
      an_email: values.an_email.trim().toLowerCase(),
      an_telefone: onlyNumbers(values.an_telefone),
      bo_categ_cliente: values.bo_categ_cliente,
      bo_categ_func: values.bo_categ_func,
      bo_sts_reg: values.bo_sts_reg,
      an_cargo: values.bo_categ_func ? values.an_cargo.trim() : '',
      nm_comissao_func: values.bo_categ_func ? values.nm_comissao_func ?? 0 : 0,
      endereco: {
        ca_cep: onlyNumbers(values.ca_cep),
        an_logradouro: values.an_logradouro.trim(),
        an_numero: values.an_numero.trim(),
        an_complemento: values.an_complemento.trim(),
        an_bairro: values.an_bairro.trim(),
        an_cidade: values.an_cidade.trim(),
        cn_estado: values.cn_estado,
      },
    }

    if (props.person) await updatePerson(props.person.cn_pessoa, person)
    else await createPerson(person)
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
  [() => props.visible, () => props.person],
  ([visible, person]) => {
    if (!visible) return

    const form = PersonModel.createForm()

    if (person) {
      const endereco = person.endereco
      if (endereco) {
        form.ca_cep = maskCep(endereco.ca_cep ?? '')
        form.an_logradouro = endereco.an_logradouro ?? ''
        form.an_numero = endereco.an_numero ?? ''
        form.an_complemento = endereco.an_complemento ?? ''
        form.an_bairro = endereco.an_bairro ?? ''
        form.an_cidade = endereco.an_cidade ?? ''
        form.cn_estado = endereco.cn_estado ?? ''
      }
      form.ca_tipo = person.ca_tipo
      form.bo_categ_cliente = person.bo_categ_cliente
      form.bo_categ_func = person.bo_categ_func
      form.bo_sts_reg = person.bo_sts_reg
      form.an_email = person.an_email ?? ''
      form.an_telefone = maskPersonPhone(person.an_telefone ?? '')
      form.an_cargo = person.an_cargo ?? ''
      form.nm_comissao_func = person.nm_comissao_func ?? 0
      if (person.ca_tipo === 'PF') {
        form.an_nome = person.an_nome ?? ''
        form.ca_cpf = maskCpf(person.ca_cpf ?? '')
      } else {
        form.an_razao_social = person.an_razao_social ?? ''
        form.an_nome_fantasia = person.an_nome_fantasia ?? ''
        form.ca_cnpj = maskCnpj(person.ca_cnpj ?? '')
      }
    }

    formData.value = form
    formErrors.value = {}
    formKey.value++
    loadEstados()
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar pessoa' : 'Cadastrar pessoa'"
    modal
    :style="{ width: '96rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      class="flex flex-col gap-4"
      v-model:errors="formErrors"
      :initialValues="formData"
      :modelValues="formData"
      :fields="config.fields"
      @submit="onSubmit"
    >
      <Fieldset legend="Dados principais">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="m-[4px] col-span-4 col-start-9 row-start-1 lg:col-span-2 lg:col-start-11 flex items-end"
            name="bo_sts_reg"
          >
            <StatusField v-model="formData.bo_sts_reg" />
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-8 col-start-1 row-start-1 lg:col-span-10"
            name="bo_categ_cliente"
            label="Categorias"
            v-slot="{ invalid }"
          >
            <SelectButton
              v-model="selectedCategories"
              :options="personCategories"
              optionLabel="label"
              optionValue="value"
              aria-label="Categorias"
              :invalid="invalid"
              :allowEmpty="false"
              multiple
            />
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-2"
            name="ca_tipo"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <Select
                :aria-required="required"
                v-model="formData.ca_tipo"
                :inputId="`person-${field}`"
                :name="field"
                aria-label="Tipo de pessoa"
                :options="personTypes"
                :invalid
                optionLabel="label"
                optionValue="value"
                fluid
              />
              <label :for="`person-${field}`">Tipo de pessoa</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            v-if="formData.ca_tipo === 'PF'"
            class="m-[4px] col-span-12 sm:col-span-2"
            name="ca_cpf"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputText
                :aria-required="required"
                :id="`person-${field}`"
                v-model="formData.ca_cpf"
                :name="field"
                :invalid="invalid"
                fluid
                maxlength="14"
                @update:modelValue="formData.ca_cpf = maskCpf($event ?? '')"
              />
              <label :for="`person-${field}`">CPF</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            v-if="formData.ca_tipo === 'PJ'"
            class="m-[4px] col-span-12 sm:col-span-2"
            name="ca_cnpj"
            v-slot="{ invalid, field, required }"
          >
            <div class="flex gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <InputText
                  :aria-required="required"
                  :id="`person-${field}`"
                  :modelValue="formData.ca_cnpj"
                  :name="field"
                  :invalid="invalid"
                  maxlength="18"
                  fluid
                  @update:modelValue="formData.ca_cnpj = maskCnpj($event ?? '')"
                />
                <label :for="`person-${field}`">CNPJ</label>
              </FloatLabel>
              <Button
                type="button"
                icon="pi pi-search"
                aria-label="Consultar CNPJ"
                :loading="loadingButton"
                @click="handleCnpj()"
              />
            </div>
          </FieldForm>
          <FieldForm
            v-if="formData.ca_tipo === 'PF'"
            class="m-[4px] col-span-12 sm:col-span-8"
            name="an_nome"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputText
                :aria-required="required"
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.an_nome"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Nome completo</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            v-if="formData.ca_tipo === 'PJ'"
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="an_razao_social"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputText
                :aria-required="required"
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.an_razao_social"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Razão social</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            v-if="formData.ca_tipo === 'PJ'"
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="an_nome_fantasia"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputText
                :aria-required="required"
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.an_nome_fantasia"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Nome fantasia</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            v-if="formData.ca_tipo === 'PJ'"
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="an_telefone"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputText
                :aria-required="required"
                :id="`person-${field}`"
                maxlength="15"
                v-model="formData.an_telefone"
                @update:modelValue="formData.an_telefone = maskPersonPhone($event ?? '')"
                :name="field"
                :invalid="invalid"
                fluid
                type="tel"
              />
              <label :for="`person-${field}`">Telefone</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="an_email"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputText
                :aria-required="required"
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.an_email"
                :name="field"
                :invalid="invalid"
                fluid
                type="email"
              />
              <label :for="`person-${field}`">E-mail</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            v-if="formData.ca_tipo === 'PF'"
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="an_telefone"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputText
                :aria-required="required"
                :id="`person-${field}`"
                maxlength="15"
                v-model="formData.an_telefone"
                @update:modelValue="formData.an_telefone = maskPersonPhone($event ?? '')"
                :name="field"
                :invalid="invalid"
                fluid
                type="tel"
              />
              <label :for="`person-${field}`">Telefone</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset legend="Endereço">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-4 lg:col-span-3"
            name="ca_cep"
            v-slot="{ invalid, field, required }"
          >
            <div class="flex gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <InputText
                  :aria-required="required"
                  :id="`person-${field}`"
                  v-model="formData.ca_cep"
                  @update:modelValue="formData.ca_cep = maskCep($event ?? '')"
                  inputmode="numeric"
                  :name="field"
                  maxlength="9"
                  :invalid="invalid"
                  fluid
                />
                <label :for="`person-${field}`">CEP</label>
              </FloatLabel>
              <Button
                type="button"
                icon="pi pi-search"
                aria-label="Consultar CEP"
                :loading="loadingButton"
                @click="handleCep()"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-8 lg:col-span-7"
            name="an_logradouro"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputText
                :aria-required="required"
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.an_logradouro"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Logradouro</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-3 lg:col-span-2"
            name="an_numero"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputText
                :aria-required="required"
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.an_numero"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Número</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-9 lg:col-span-3"
            name="an_complemento"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.an_complemento"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Complemento</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-5 lg:col-span-4"
            name="an_bairro"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputText
                :aria-required="required"
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.an_bairro"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Bairro</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-4 lg:col-span-3"
            name="an_cidade"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputText
                :aria-required="required"
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.an_cidade"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Cidade</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-3 lg:col-span-2"
            name="cn_estado"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <Select
                :aria-required="required"
                v-model="formData.cn_estado"
                :name="field"
                :options="estadosData"
                optionLabel="ca_uf"
                optionValue="cn_estado"
                :invalid="invalid"
                fluid
              >
                <template #option="{ option }">
                  {{ option.an_descr }}
                </template>
              </Select>
              <label :for="`person-${field}`">Estado (UF)</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset :disabled="!formData.bo_categ_func" legend="Dados do funcionário">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="m-[4px] col-span-12 sm:col-span-8" name="an_cargo" v-slot="{ field }">
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.an_cargo"
                :name="field"
                fluid
              />
              <label :for="`person-${field}`">Cargo</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-4"
            name="nm_comissao_func"
            v-slot="{ invalid, field, required }"
          >
            <FloatLabel variant="on">
              <InputNumber
                :aria-required="required"
                :inputId="`person-${field}`"
                v-model="formData.nm_comissao_func"
                :name="field"
                :min="0"
                :max="100"
                :maxFractionDigits="2"
                locale="pt-BR"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Comissão (%)</label>
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
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </Dialog>
</template>
