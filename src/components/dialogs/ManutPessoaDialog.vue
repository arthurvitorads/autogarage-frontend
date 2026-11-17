<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Dialog from 'primevue/dialog'
import Fieldset from 'primevue/fieldset'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Button from 'primevue/button'
import Message from 'primevue/message'

import StatusField from '@/components/field/StatusField.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type { IManutPessoaDialogProps } from '@/interface/pages/PessoaPage'

import { PersonModel } from '@/models/person.model'
import type { Pessoa } from '@/models/pessoa.model'

import type { IEndEstado } from '@/interface/tables'
import type { IFormPageRef } from '@/interface/util'


import { TipoPessoa } from '@/interface/enum'
import { getStates } from '@/services/address.service'
import { createPerson, personToRequest, updatePerson } from '@/services/person.service'
import type { IFormPessoa } from '@/interface/pages/PessoaPage'
import type { TGenericData } from '@/interface/util'

import {
  validateCPF,
  validateCNPJ,
  validateEmail,
  onlyNumbers,
  unMaskDocument,
  maskCpf,
  maskCnpj,
} from '@/services/util.service'
import { fetchCep } from '@/services/cep.service'
import { fetchCnpj } from '@/services/documento.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'

const props = defineProps<IManutPessoaDialogProps>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: []
}>()

const { showError, showWarn, showSuccess } = useAppToast()
const { normalizeError, setLoading } = useUtilStore()
const { loading } = storeToRefs(useUtilStore())

const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)

const isEditing = computed(() => !!props.person)
const isEmployee = computed(() => formData.value.bo_categ_func)

const personTypes = [
  { label: 'Física', value: TipoPessoa.PF },
  { label: 'Jurídica', value: TipoPessoa.PJ },
]

const loadingPostalCode = ref(false)
const postalCodeMessage = ref('')
const loadingCnpj = ref(false)

const formData = ref<IFormPessoa>(PersonModel.createForm())
type TPersonCategory = 'bo_categ_cliente' | 'bo_categ_func'
const personCategories: { label: string; value: TPersonCategory }[] = [
  { label: 'Cliente', value: 'bo_categ_cliente' },
  { label: 'Funcionário', value: 'bo_categ_func' },
]

const selectedCategories = computed({
  get: () =>
    personCategories.filter(({ value }) => formData.value[value]).map(({ value }) => value),
  set: (values: TPersonCategory[]) => {
    for (const { value } of personCategories) formData.value[value] = values.includes(value)
  },
})
const states = ref<IEndEstado[]>([])
const loadingStates = ref(false)

function stateIdForUf(uf: string) {
  return states.value.find((state) => state.ca_uf === uf.trim().toUpperCase())?.cn_estado ?? ''
}

async function loadStates() {
  if (loadingStates.value) return

  loadingStates.value = true
  states.value = []
  try {
    states.value = (await getStates()).filter((state) => state.ca_pais === 'BR')
    if (!states.value.length) showError('Nenhuma UF brasileira foi cadastrada.')
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    loadingStates.value = false
  }
}

function maskCep(value: string) {
  return onlyNumbers(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2')
}

function maskPersonPhone(value: string) {
  const digits = onlyNumbers(value).slice(0, 11)
  if (digits.length <= 2) return digits

  const number = digits.slice(2)
  const prefixLength = digits.length === 11 ? 5 : 4
  const localNumber =
    number.length > prefixLength
      ? number.slice(0, prefixLength) + '-' + number.slice(prefixLength)
      : number
  return '(' + digits.slice(0, 2) + ') ' + localNumber
}

async function handleCnpj() {
  if (loadingCnpj.value) return

  const form = formData.value
  const cnpj = unMaskDocument(form.cnpj).toUpperCase()
  if (!validateCNPJ(cnpj)) {
    formErrors.value.cnpj = 'Informe um CNPJ válido.'
    return
  }

  loadingCnpj.value = true
  delete formErrors.value.cnpj
  try {
    const empresa = await fetchCnpj(cnpj)
    if (!props.visible || form !== formData.value || form.tipo !== 'PJ' ||
        cnpj !== unMaskDocument(form.cnpj).toUpperCase()) return

    if (!empresa) {
      formErrors.value.cnpj = 'Não foi encontrado nenhum cadastro para este CNPJ.'
      showWarn(formErrors.value.cnpj)
      return
    }

    form.razaoSocial = empresa.razao_social.trim()
    if (empresa.nome_fantasia) form.nomeFantasia = empresa.nome_fantasia.trim()
    if (empresa.email) form.email = empresa.email.trim()
    if (empresa.ddd_telefone_1) form.telefone = maskPersonPhone(empresa.ddd_telefone_1)
    else if (empresa.ddd_telefone_2) form.telefone = maskPersonPhone(empresa.ddd_telefone_2)
    if (empresa.cep) form.cep = maskCep(empresa.cep)
    if (empresa.logradouro) {
      form.logradouro = empresa.logradouro.trim()
      const streetType = empresa.descricao_tipo_de_logradouro?.trim()
      if (streetType && !form.logradouro.toUpperCase().startsWith(streetType.toUpperCase() + ' '))
        form.logradouro = streetType + ' ' + form.logradouro
    }
    if (empresa.numero) form.numero = empresa.numero.trim()
    if (empresa.complemento) form.complemento = empresa.complemento.trim()
    if (empresa.bairro) form.bairro = empresa.bairro.trim()
    if (empresa.municipio) form.cidade = empresa.municipio.trim()
    if (empresa.uf) form.cn_estado = stateIdForUf(empresa.uf) || form.cn_estado

    formErrors.value = {}
    showSuccess('Processo realizado com sucesso.')
  } catch (error) {
    if (!props.visible || form !== formData.value || form.tipo !== 'PJ' ||
        cnpj !== unMaskDocument(form.cnpj).toUpperCase()) return

    formErrors.value.cnpj = normalizeError(error)
    showError(formErrors.value.cnpj)
  } finally {
    loadingCnpj.value = false
  }
}

async function handleCep() {
  if (loadingPostalCode.value) return

  const form = formData.value
  const cep = onlyNumbers(form.cep)
  if (cep.length !== 8) {
    formErrors.value.cep = 'Informe um CEP com 8 dígitos.'
    return
  }

  loadingPostalCode.value = true
  postalCodeMessage.value = ''
  try {
    const address = await fetchCep(cep)
    if (!props.visible || form !== formData.value || cep !== onlyNumbers(form.cep)) return

    if (address.logradouro) form.logradouro = address.logradouro
    if (address.bairro) form.bairro = address.bairro
    if (address.localidade) form.cidade = address.localidade
    form.cn_estado = stateIdForUf(address.uf) || form.cn_estado
    delete formErrors.value.cep
    delete formErrors.value.logradouro
    delete formErrors.value.bairro
    delete formErrors.value.cidade
    delete formErrors.value.cn_estado
  } catch (error) {
    if (!props.visible || form !== formData.value || cep !== onlyNumbers(form.cep)) return

    postalCodeMessage.value = normalizeError(error) + ' Preencha o endereço manualmente.'
    showWarn(postalCodeMessage.value)
  } finally {
    loadingPostalCode.value = false
  }
}

async function onSubmit(values: IFormPessoa) {
  const errors: TGenericData = {}

  if (!values.bo_categ_cliente && !values.bo_categ_func)
    errors.bo_categ_cliente = 'Selecione pelo menos uma categoria.'

  if (values.tipo === 'PF') {
    if (!values.nome.trim()) errors.nome = 'Campo obrigatório.'

    if (!validateCPF(values.cpf)) errors.cpf = 'Informe um CPF válido.'
  } else {
    if (!values.razaoSocial.trim()) errors.razaoSocial = 'Campo obrigatório.'

    if (!values.nomeFantasia.trim()) errors.nomeFantasia = 'Campo obrigatório.'

    if (!validateCNPJ(values.cnpj)) errors.cnpj = 'Informe um CNPJ válido.'
  }

  if (!values.email.trim()) errors.email = 'Campo obrigatório.'
  else if (!validateEmail(values.email.trim())) errors.email = 'Informe um e-mail válido.'

  if (!values.telefone.trim()) errors.telefone = 'Campo obrigatório.'
  else if (
    !/^[0-9 ()+.-]+$/.test(values.telefone) ||
    ![10, 11].includes(onlyNumbers(values.telefone).length)
  )
    errors.telefone = 'Informe um telefone com DDD (10 ou 11 dígitos).'

  if (!/^\d{5}-?\d{3}$/.test(values.cep.trim())) errors.cep = 'Informe um CEP válido.'

  if (!values.logradouro.trim()) errors.logradouro = 'Campo obrigatório.'

  if (!values.numero.trim()) errors.numero = 'Campo obrigatório.'

  if (!values.bairro.trim()) errors.bairro = 'Campo obrigatório.'

  if (!values.cidade.trim()) errors.cidade = 'Campo obrigatório.'

  if (!values.cn_estado)
    errors.cn_estado = 'Selecione uma UF válida.'

  if (
    values.bo_categ_func &&
    (values.nm_comissao_func === null ||
      !Number.isFinite(values.nm_comissao_func) ||
      values.nm_comissao_func < 0 ||
      values.nm_comissao_func > 100)
  )
    errors.nm_comissao_func = 'A comissão deve estar entre 0% e 100%.'

  const document = unMaskDocument(values.tipo === 'PF' ? values.cpf : values.cnpj).toUpperCase()
  const duplicateDocument = (props.people ?? []).some(
    (person) =>
      person !== props.person &&
      (props.person?.cn_pessoa === undefined || person.cn_pessoa !== props.person.cn_pessoa) &&
      unMaskDocument(person.tipo === 'PF' ? person.cpf : person.cnpj).toUpperCase() === document,
  )

  if (duplicateDocument) errors[values.tipo === 'PF' ? 'cpf' : 'cnpj'] = 'Documento já cadastrado.'

  formErrors.value = errors
  if (Object.keys(errors).length) return

  setLoading(true)

  try {
    const personData = {
      ...(props.person?.cn_pessoa !== undefined ? { cn_pessoa: props.person.cn_pessoa } : {}),
      bo_categ_cliente: values.bo_categ_cliente,
      bo_categ_func: values.bo_categ_func,
      bo_sts_reg: values.bo_sts_reg,
      email: values.email.trim().toLowerCase(),
      telefone: onlyNumbers(values.telefone),
      endereco: {
        cep: onlyNumbers(values.cep),
        logradouro: values.logradouro.trim(),
        numero: values.numero.trim(),
        complemento: values.complemento.trim(),
        bairro: values.bairro.trim(),
        cidade: values.cidade.trim(),
        cn_estado: values.cn_estado,
      },
      ...(values.bo_categ_func
        ? {
            cargo: values.cargo.trim(),
            nm_comissao_func: values.nm_comissao_func ?? 0,
          }
        : {}),
    }
    const person: Pessoa =
      values.tipo === 'PF'
        ? {
            ...personData,
            tipo: 'PF',
            nome: values.nome.trim(),
            cpf: document,
          }
        : {
            ...personData,
            tipo: 'PJ',
            razaoSocial: values.razaoSocial.trim(),
            nomeFantasia: values.nomeFantasia.trim(),
            cnpj: document,
          }

    if (props.person?.cn_pessoa !== undefined)
      await updatePerson(props.person.cn_pessoa, personToRequest(person))
    else await createPerson(personToRequest(person))
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
      Object.assign(form, person.endereco)
      form.cep = maskCep(form.cep)
      form.tipo = person.tipo
      form.bo_categ_cliente = person.bo_categ_cliente
      form.bo_categ_func = person.bo_categ_func
      form.bo_sts_reg = person.bo_sts_reg
      form.email = person.email
      form.telefone = maskPersonPhone(person.telefone)
      form.cargo = person.cargo ?? ''
      form.nm_comissao_func = person.nm_comissao_func ?? 0
      if (person.tipo === 'PF') {
        form.nome = person.nome
        form.cpf = maskCpf(person.cpf)
      } else {
        form.razaoSocial = person.razaoSocial
        form.nomeFantasia = person.nomeFantasia
        form.cnpj = maskCnpj(person.cnpj)
      }
    }

    formData.value = form
    formErrors.value = {}
    postalCodeMessage.value = ''
    formKey.value++
    if (!states.value.length) void loadStates()
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
      @submit="onSubmit(formData)"
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
            name="tipo"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <Select
                v-model="formData.tipo"
                inputId="tipo-pessoa"
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
            v-if="formData.tipo === 'PF'"
            class="m-[4px] col-span-12 sm:col-span-2"
            name="cpf"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                v-model="formData.cpf"
                :name="field"
                :invalid="invalid"
                fluid
                maxlength="14"
                @update:modelValue="formData.cpf = maskCpf($event ?? '')"
              />
              <label :for="`person-${field}`">CPF</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            v-if="formData.tipo === 'PJ'"
            class="m-[4px] col-span-12 sm:col-span-2"
            name="cnpj"
            v-slot="{ invalid, field }"
          >
            <div class="flex gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <InputText
                  :id="`person-${field}`"
                  :modelValue="formData.cnpj"
                  :name="field"
                  :invalid="invalid"
                  maxlength="18"
                  fluid
                  @update:modelValue="formData.cnpj = maskCnpj($event ?? '')"
                />
                <label :for="`person-${field}`">CNPJ</label>
              </FloatLabel>
              <Button
                type="button"
                icon="pi pi-search"
                aria-label="Consultar CNPJ"
                :loading="loadingCnpj"
                @click="handleCnpj()"
              />
            </div>
          </FieldForm>
          <FieldForm
            v-if="formData.tipo === 'PF'"
            class="m-[4px] col-span-12 sm:col-span-8"
            name="nome"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.nome"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Nome completo</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            v-if="formData.tipo === 'PJ'"
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="razaoSocial"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.razaoSocial"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Razão social</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            v-if="formData.tipo === 'PJ'"
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="nomeFantasia"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.nomeFantasia"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Nome fantasia</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            v-if="formData.tipo === 'PJ'"
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="telefone"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="15"
                v-model="formData.telefone"
                @update:modelValue="formData.telefone = maskPersonPhone($event ?? '')"
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
            name="email"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.email"
                :name="field"
                :invalid="invalid"
                fluid
                type="email"
              />
              <label :for="`person-${field}`">E-mail</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            v-if="formData.tipo === 'PF'"
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="telefone"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="15"
                v-model="formData.telefone"
                @update:modelValue="formData.telefone = maskPersonPhone($event ?? '')"
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
          <Message v-if="postalCodeMessage" severity="warn" class="col-span-12 mb-3">{{
            postalCodeMessage
          }}</Message>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-4 lg:col-span-3"
            name="cep"
            v-slot="{ invalid, field }"
          >
            <div class="flex gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <InputText
                  :id="`person-${field}`"
                  v-model="formData.cep"
                  @update:modelValue="formData.cep = maskCep($event ?? '')"
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
                :loading="loadingPostalCode"
                @click="handleCep()"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-8 lg:col-span-7"
            name="logradouro"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.logradouro"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Logradouro</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-3 lg:col-span-2"
            name="numero"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.numero"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Número</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-9 lg:col-span-3"
            name="complemento"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.complemento"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Complemento</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-5 lg:col-span-4"
            name="bairro"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.bairro"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label :for="`person-${field}`">Bairro</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-4 lg:col-span-3"
            name="cidade"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.cidade"
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
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <Select
                v-model="formData.cn_estado"
                :name="field"
                :options="states"
                optionLabel="ca_uf"
                optionValue="cn_estado"
                :invalid="invalid"
                :loading="loadingStates"
                :disabled="loadingStates || !states.length"
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
      <Fieldset v-if="isEmployee" legend="Dados do funcionário">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="m-[4px] col-span-12 sm:col-span-8" name="cargo" v-slot="{ field }">
            <FloatLabel variant="on">
              <InputText
                :id="`person-${field}`"
                maxlength="4000"
                v-model="formData.cargo"
                :name="field"
                fluid
              />
              <label :for="`person-${field}`">Cargo</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-4"
            name="nm_comissao_func"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputNumber
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
          :disabled="loading"
          :loading="loading"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </Dialog>
</template>
