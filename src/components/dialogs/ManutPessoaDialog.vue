<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Fieldset from 'primevue/fieldset'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Button from 'primevue/button'
import Message from 'primevue/message'

import StatusField from '@/components/field/StatusField.vue'

import type { IManutPersonDialogProps } from '@/interface/pages/PessoaPage'

import { PersonModel } from '@/models/person.model'
import type { IFormPageRef } from '@/interface/util'


import Dialog from 'primevue/dialog'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type { Pessoa } from '@/models/pessoa.model'
import { TipoPessoa } from '@/interface/enum'
import { getStates, type IEndEstado } from '@/services/address.service'
import { createPerson, personToRequest, updatePerson } from '@/services/person.service'
import type { IFormPerson } from '@/interface/pages/PessoaPage'
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

const props = defineProps<IManutPersonDialogProps>()

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
const isValidated = ref(false)

const isEditing = computed(() => !!props.person)
const isEmployee = computed(() => formData.value.bo_categ_func)

const personTypes = [
  { label: 'Física', value: TipoPessoa.PF },
  { label: 'Jurídica', value: TipoPessoa.PJ },
]

const loadingPostalCode = ref(false)
const postalCodeMessage = ref('')
const queriedPostalCode = ref('')
let postalCodeRequestId = 0

const loadingCnpj = ref(false)
const queriedCnpj = ref('')
const missingCnpj = ref('')
let cnpjRequestId = 0

const companyFields = [
  'razaoSocial',
  'nomeFantasia',
  'email',
  'telefone',
  'cep',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'cn_estado',
] as const
type TCampoCnpj = (typeof companyFields)[number]
let filledCompanyFields: Partial<Record<TCampoCnpj, string>> = {}

const formData = ref<IFormPerson>(PersonModel.createForm())
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
let statesRequest: Promise<void> | undefined
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

function resetCnpjQuery(clearFields = false) {
  cnpjRequestId++
  loadingCnpj.value = false
  queriedCnpj.value = ''
  missingCnpj.value = ''
  delete formErrors.value.cnpj

  if (clearFields) {
    for (const field of companyFields) {
      if (
        filledCompanyFields[field] !== undefined &&
        formData.value[field] === filledCompanyFields[field]
      )
        formData.value[field] = ''
    }
  }

  filledCompanyFields = {}
}

function onCnpjChange(value: string | null | undefined) {
  formData.value.cnpj = maskCnpj(value ?? '')

  if (unMaskDocument(formData.value.cnpj).length === 14) void queryCnpj()
}

function getCnpjText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function maskCep(value: string) {
  return onlyNumbers(value).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2')
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

async function queryCnpj(forceQuery = false) {
  if (!props.visible || formData.value.tipo !== 'PJ' || loadingCnpj.value) return

  const cnpj = unMaskDocument(formData.value.cnpj).toUpperCase()

  if (!cnpj) return

  if (!validateCNPJ(cnpj)) {
    showError('O CNPJ informado é inválido.')
    formErrors.value.cnpj = 'Informe um CNPJ válido.'
    return
  }

  if (!forceQuery && (queriedCnpj.value === cnpj || missingCnpj.value === cnpj)) return

  const currentRequest = ++cnpjRequestId
  const previousValues = { ...formData.value }
  loadingCnpj.value = true
  delete formErrors.value.cnpj

  try {
    const company = await fetchCnpj(cnpj)
    await statesRequest

    if (currentRequest !== cnpjRequestId) return

    if (!company) {
      missingCnpj.value = cnpj
      formErrors.value.cnpj = 'Erro ao consultar CNPJ'
      showWarn('Não foi encontrado nenhum cadastro para este CNPJ.')
      return
    }

    const streetType = getCnpjText(company.descricao_tipo_de_logradouro)
    const street = getCnpjText(company.logradouro)
    const phone =
      [company.ddd_telefone_1, company.ddd_telefone_2]
        .map((value) => onlyNumbers(getCnpjText(value)))
        .find((value) => [10, 11].includes(value.length)) ?? ''
    const postalCode = onlyNumbers(getCnpjText(company.cep))
    const companyData: Record<TCampoCnpj, string> = {
      razaoSocial: getCnpjText(company.razao_social),
      nomeFantasia: getCnpjText(company.nome_fantasia),
      email: getCnpjText(company.email),
      telefone: maskPersonPhone(phone),
      cep: postalCode.length === 8 ? maskCep(postalCode) : '',
      logradouro:
        street && streetType && !street.toUpperCase().startsWith(streetType.toUpperCase() + ' ')
          ? streetType + ' ' + street
          : street,
      numero: getCnpjText(company.numero),
      complemento: getCnpjText(company.complemento),
      bairro: getCnpjText(company.bairro),
      cidade: getCnpjText(company.municipio),
      cn_estado: stateIdForUf(getCnpjText(company.uf)),
    }

    if (companyData.cep && formData.value.cep === previousValues.cep) {
      postalCodeRequestId++
      loadingPostalCode.value = false
    }

    for (const field of companyFields) {
      // Não substituir alterações feitas enquanto a consulta estava em andamento.
      if (companyData[field] && formData.value[field] === previousValues[field]) {
        formData.value[field] = companyData[field]
        filledCompanyFields[field] = companyData[field]
        delete formErrors.value[field]
      }
    }

    queriedCnpj.value = cnpj
    missingCnpj.value = ''
    showSuccess('CNPJ confirmado. Confira os dados preenchidos e complete os campos restantes.')

    if (filledCompanyFields.cep && formData.value.cep === filledCompanyFields.cep)
      await queryPostalCode(true)
  } catch (error) {
    if (currentRequest !== cnpjRequestId) return

    const message = normalizeError(error)
    formErrors.value.cnpj = message
    showError(message)
  } finally {
    if (currentRequest === cnpjRequestId) loadingCnpj.value = false
  }
}

async function queryPostalCode(fillOnlyEmpty = false) {
  if (loadingPostalCode.value) return

  const postalCode = onlyNumbers(formData.value.cep)

  if (postalCode.length !== 8) {
    formErrors.value.cep = 'Informe um CEP com 8 dígitos.'
    return
  }

  const currentRequest = ++postalCodeRequestId
  loadingPostalCode.value = true
  postalCodeMessage.value = ''

  try {
    const address = await fetchCep(postalCode)
    await statesRequest

    if (currentRequest !== postalCodeRequestId) return

    if (!fillOnlyEmpty || !formData.value.logradouro) {
      formData.value.logradouro = address.logradouro

      if (fillOnlyEmpty) filledCompanyFields.logradouro = address.logradouro
    }

    if (!fillOnlyEmpty || !formData.value.bairro) {
      formData.value.bairro = address.bairro

      if (fillOnlyEmpty) filledCompanyFields.bairro = address.bairro
    }

    if (!fillOnlyEmpty || !formData.value.cidade) {
      formData.value.cidade = address.localidade

      if (fillOnlyEmpty) filledCompanyFields.cidade = address.localidade
    }

    const stateId = stateIdForUf(address.uf)
    if (stateId && (!fillOnlyEmpty || !formData.value.cn_estado)) {
      formData.value.cn_estado = stateId

      if (fillOnlyEmpty) filledCompanyFields.cn_estado = stateId
    }

    for (const field of ['cep', 'logradouro', 'bairro', 'cidade', 'cn_estado'])
      delete formErrors.value[field]
  } catch (error) {
    if (currentRequest !== postalCodeRequestId) return

    postalCodeMessage.value = normalizeError(error) + ' Preencha o endereço manualmente.'
    showWarn(postalCodeMessage.value)
  } finally {
    if (currentRequest === postalCodeRequestId) {
      queriedPostalCode.value = postalCode
      loadingPostalCode.value = false
    }
  }
}

async function onSubmit(values: IFormPerson) {
  if (loadingPostalCode.value || loadingCnpj.value || loadingStates.value || !states.value.length)
    return

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
    else if (missingCnpj.value === unMaskDocument(values.cnpj).toUpperCase())
      errors.cnpj = 'Não foi encontrado nenhum cadastro para este CNPJ.'
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
  else if (queriedPostalCode.value !== onlyNumbers(values.cep))
    errors.cep =
      'Consulte o CEP antes de gravar. Se a consulta falhar, preencha o endereço manualmente.'

  if (!values.logradouro.trim()) errors.logradouro = 'Campo obrigatório.'

  if (!values.numero.trim()) errors.numero = 'Campo obrigatório.'

  if (!values.bairro.trim()) errors.bairro = 'Campo obrigatório.'

  if (!values.cidade.trim()) errors.cidade = 'Campo obrigatório.'

  if (!states.value.some((state) => state.cn_estado === values.cn_estado))
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
  isValidated.value = !Object.keys(errors).length

  if (!isValidated.value) return

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
    showSuccess('Pessoa gravada com sucesso.')
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
  ([visible]) => {
    resetCnpjQuery()
    postalCodeRequestId++
    loadingPostalCode.value = false

    if (!visible) return

    const person = props.person

    formData.value = person
      ? {
        ...PersonModel.createForm(),
        tipo: person.tipo,
        bo_categ_cliente: person.bo_categ_cliente,
        bo_categ_func: person.bo_categ_func,
        bo_sts_reg: person.bo_sts_reg,
        nome: person.tipo === 'PF' ? person.nome : '',
        cpf: person.tipo === 'PF' ? maskCpf(person.cpf) : '',
        cnpj: person.tipo === 'PJ' ? maskCnpj(person.cnpj) : '',
        razaoSocial: person.tipo === 'PJ' ? person.razaoSocial : '',
        nomeFantasia: person.tipo === 'PJ' ? person.nomeFantasia : '',
        email: person.email,
        telefone: maskPersonPhone(person.telefone),
        cargo: person.cargo ?? '',
        nm_comissao_func: person.nm_comissao_func ?? 0,
        ...person.endereco,
        cep: maskCep(person.endereco.cep),
      }
      : PersonModel.createForm()
    formErrors.value = {}
    isValidated.value = false
    postalCodeMessage.value = ''
    queriedPostalCode.value = person ? onlyNumbers(person.endereco.cep) : ''
    formKey.value++
  },
  { immediate: true },
)

watch(
  () => props.visible,
  (visible) => {
    if (visible && !loadingStates.value) statesRequest = loadStates()
  },
  { immediate: true },
)

watch(
  () => formData.value.cep,
  () => {
    postalCodeRequestId++
    loadingPostalCode.value = false
    queriedPostalCode.value = ''
    postalCodeMessage.value = ''
  },
  { flush: 'sync' },
)

watch(
  () => formData.value.tipo,
  () => {
    resetCnpjQuery()
    postalCodeRequestId++
    loadingPostalCode.value = false
    formErrors.value = {}
    isValidated.value = false
  },
  { flush: 'sync' },
)

watch(
  () => unMaskDocument(formData.value.cnpj).toUpperCase(),
  () => {
    resetCnpjQuery(true)
    postalCodeRequestId++
    loadingPostalCode.value = false
    isValidated.value = false
  },
  { flush: 'sync' },
)

watch(
  () => [formData.value.bo_categ_cliente, formData.value.bo_categ_func],
  () => {
    delete formErrors.value.bo_categ_cliente
    isValidated.value = false

    if (!formData.value.bo_categ_func) {
      delete formErrors.value.cargo
      delete formErrors.value.nm_comissao_func
    }
  },
)
</script>

<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar pessoa' : 'Cadastrar pessoa'" modal
    :style="{ width: '96rem', maxWidth: '95vw', maxHeight: '90vh' }">
    <FormPage ref="formRef" :key="formKey" novalidate class="flex flex-col gap-4" v-model:errors="formErrors"
      :initialValues="formData" @submit="onSubmit(formData)" @input="isValidated = false" @change="isValidated = false">
      <Fieldset legend="Dados principais">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="m-[4px] col-span-4 col-start-9 row-start-1 lg:col-span-2 lg:col-start-11 flex items-end"
            name="bo_sts_reg">
            <StatusField v-model="formData.bo_sts_reg" />
          </FieldForm>
          <FieldForm class="m-[4px] col-span-8 col-start-1 row-start-1 lg:col-span-10" name="bo_categ_cliente"
            label="Categorias" v-slot="{ invalid }">
            <SelectButton v-model="selectedCategories" :options="personCategories" optionLabel="label"
              optionValue="value" aria-label="Categorias" :invalid="invalid" :allowEmpty="false" multiple />
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-2" name="tipo" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <Select v-model="formData.tipo" inputId="tipo-pessoa" aria-label="Tipo de pessoa" :options="personTypes"
                :invalid optionLabel="label" optionValue="value" fluid />
              <label :for="`person-${field}`">Tipo de pessoa</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PF'" class="m-[4px] col-span-12 sm:col-span-2" name="cpf"
            v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" v-model="formData.cpf" :name="field" :invalid="invalid" fluid
                maxlength="14" @update:modelValue="formData.cpf = maskCpf($event ?? '')" />
              <label :for="`person-${field}`">CPF</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PJ'" class="m-[4px] col-span-12 sm:col-span-2" name="cnpj"
            v-slot="{ invalid, field }">
            <div class="flex gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <InputText :id="`person-${field}`" :modelValue="formData.cnpj" :name="field" :invalid="invalid"
                  maxlength="18" fluid @update:modelValue="onCnpjChange" @blur="queryCnpj()" />
                <label :for="`person-${field}`">CNPJ</label>
              </FloatLabel>
              <Button type="button" icon="pi pi-search" aria-label="Consultar CNPJ" :loading="loadingCnpj"
                @click="queryCnpj(true)" />
            </div>
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PF'" class="m-[4px] col-span-12 sm:col-span-8" name="nome"
            v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" maxlength="4000" v-model="formData.nome" :name="field"
                :invalid="invalid" fluid />
              <label :for="`person-${field}`">Nome completo</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PJ'" class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="razaoSocial" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" maxlength="4000" v-model="formData.razaoSocial" :name="field"
                :invalid="invalid" fluid />
              <label :for="`person-${field}`">Razão social</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PJ'" class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="nomeFantasia" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" maxlength="4000" v-model="formData.nomeFantasia" :name="field"
                :invalid="invalid" fluid />
              <label :for="`person-${field}`">Nome fantasia</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PJ'" class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="telefone" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" maxlength="15" v-model="formData.telefone"
                @update:modelValue="formData.telefone = maskPersonPhone($event ?? '')" :name="field" :invalid="invalid"
                fluid type="tel" />
              <label :for="`person-${field}`">Telefone</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4" name="email" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" maxlength="4000" v-model="formData.email" :name="field"
                :invalid="invalid" fluid type="email" />
              <label :for="`person-${field}`">E-mail</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PF'" class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="telefone" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" maxlength="15" v-model="formData.telefone"
                @update:modelValue="formData.telefone = maskPersonPhone($event ?? '')" :name="field" :invalid="invalid"
                fluid type="tel" />
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
          <FieldForm class="m-[4px] col-span-12 sm:col-span-4 lg:col-span-3" name="cep" v-slot="{ invalid, field }">
            <div class="flex gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <InputText :id="`person-${field}`" v-model="formData.cep"
                  @update:modelValue="formData.cep = maskCep($event ?? '')" inputmode="numeric" :name="field"
                  maxlength="9" :invalid="invalid" fluid @blur="queryPostalCode()" />
                <label :for="`person-${field}`">CEP</label>
              </FloatLabel>
              <Button type="button" icon="pi pi-search" aria-label="Consultar CEP" :loading="loadingPostalCode"
                @click="queryPostalCode()" />
            </div>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-8 lg:col-span-7" name="logradouro"
            v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" maxlength="4000" v-model="formData.logradouro" :name="field"
                :invalid="invalid" fluid />
              <label :for="`person-${field}`">Logradouro</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-3 lg:col-span-2" name="numero" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" maxlength="4000" v-model="formData.numero" :name="field"
                :invalid="invalid" fluid />
              <label :for="`person-${field}`">Número</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-9 lg:col-span-3" name="complemento"
            v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" maxlength="4000" v-model="formData.complemento" :name="field"
                :invalid="invalid" fluid />
              <label :for="`person-${field}`">Complemento</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-5 lg:col-span-4" name="bairro" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" maxlength="4000" v-model="formData.bairro" :name="field"
                :invalid="invalid" fluid />
              <label :for="`person-${field}`">Bairro</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-4 lg:col-span-3" name="cidade" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText :id="`person-${field}`" maxlength="4000" v-model="formData.cidade" :name="field"
                :invalid="invalid" fluid />
              <label :for="`person-${field}`">Cidade</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-3 lg:col-span-2" name="cn_estado"
            v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <Select v-model="formData.cn_estado" :name="field" :options="states" optionLabel="ca_uf"
                optionValue="cn_estado" :invalid="invalid" :loading="loadingStates"
                :disabled="loadingStates || !states.length" fluid>
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
              <InputText :id="`person-${field}`" maxlength="4000" v-model="formData.cargo" :name="field" fluid />
              <label :for="`person-${field}`">Cargo</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-4" name="nm_comissao_func" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputNumber :inputId="`person-${field}`" v-model="formData.nm_comissao_func" :name="field" :min="0"
                :max="100" :maxFractionDigits="2" locale="pt-BR" :invalid="invalid" fluid />
              <label :for="`person-${field}`">Comissão (%)</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </Fieldset>
    </FormPage>
    <template #footer>
      <div class="flex w-full justify-end gap-2 border-t border-surface-200 pt-4">
        <Button type="button" label="Cancelar" severity="secondary" @click="emit('update:visible', false)" />
        <Button type="button" label="Gravar"
          :disabled="loadingPostalCode || loadingCnpj || loadingStates || !states.length || loading" :loading="loading"
          @click="formRef?.submit()" />
      </div>
    </template>
  </Dialog>
</template>
