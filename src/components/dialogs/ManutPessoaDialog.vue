<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import SelectButton from 'primevue/selectbutton'
import Checkbox from 'primevue/checkbox'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Message from 'primevue/message'

import CadastroDialog from '@/components/dialogs/CadastroDialog.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type { Pessoa, TipoPessoa } from '@/models/pessoa'
import type { IFormPessoa } from '@/interface/interface-pages/PessoaPage'
import type { TGenericData } from '@/interface/util'

import {
  validateCPF, validateCNPJ, validateEmail, onlyNumbers,
  unMaskDocument, maskCpf, maskCnpj,
} from '@/services/util.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'

const props = defineProps<{
  visible: boolean
  pessoa?: Pessoa | null
  pessoas: Pessoa[]
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  validated: [pessoa: Pessoa]
}>()

const toast = useAppToast()
const { fetchCep, fetchCnpj, normalizeError, setLoading } = useUtilStore()

const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<{ submit: () => void } | null>(null)
const isValidated = ref(false)

const isEditing = computed(() => !!props.pessoa)
const isFuncionario = computed(() => formData.value.bo_categ_func)

const tiposPessoa: { label: string; value: TipoPessoa }[] = [
  { label: 'Pessoa física', value: 'PF' },
  { label: 'Pessoa jurídica', value: 'PJ' },
]

const ufs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const loadingCep = ref(false)
const mensagemCep = ref('')
const cepConsultado = ref('')
let consultaCepId = 0

const loadingCnpj = ref(false)
const cnpjConsultado = ref('')
const cnpjNaoEncontrado = ref('')
let consultaCnpjId = 0

const camposCnpj = [
  'razaoSocial', 'nomeFantasia', 'email', 'telefone', 'cep',
  'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf',
] as const
type TCampoCnpj = typeof camposCnpj[number]
let dadosCnpjPreenchidos: Partial<Record<TCampoCnpj, string>> = {}

function formDataDefault(): IFormPessoa {
  return {
    tipo: 'PF',
    bo_categ_cliente: true,
    bo_categ_func: false,
    bo_sts_reg: true,
    nome: '',
    cpf: '',
    cnpj: '',
    razaoSocial: '',
    nomeFantasia: '',
    email: '',
    telefone: '',
    cargo: '',
    comissaoPercentual: 0,
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  }
}

const formData = ref<IFormPessoa>(formDataDefault())

function resetConsultaCnpj(limparCampos = false) {
  consultaCnpjId++
  loadingCnpj.value = false
  cnpjConsultado.value = ''
  cnpjNaoEncontrado.value = ''
  delete formErrors.value.cnpj

  if (limparCampos) {
    for (const campo of camposCnpj) {
      if (dadosCnpjPreenchidos[campo] !== undefined && formData.value[campo] === dadosCnpjPreenchidos[campo])
        formData.value[campo] = ''
    }
  }

  dadosCnpjPreenchidos = {}
}

function onCnpjChange(value: string | null | undefined) {
  formData.value.cnpj = maskCnpj(value ?? '')

  if (unMaskDocument(formData.value.cnpj).length === 14)
    void consultarCnpj()
}

function getCnpjText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

async function consultarCnpj(forcarConsulta = false) {
  if (!props.visible || formData.value.tipo !== 'PJ' || loadingCnpj.value) return

  const cnpj = unMaskDocument(formData.value.cnpj).toUpperCase()

  if (!cnpj) return

  if (!validateCNPJ(cnpj)) {
    toast.error('O CNPJ informado é inválido.')
    formErrors.value.cnpj = 'Informe um CNPJ válido.'
    return
  }

  if (!forcarConsulta && (cnpjConsultado.value === cnpj || cnpjNaoEncontrado.value === cnpj)) return

  const consultaAtual = ++consultaCnpjId
  const valoresAnteriores = { ...formData.value }
  loadingCnpj.value = true
  delete formErrors.value.cnpj

  try {
    const empresa = await fetchCnpj(cnpj)

    if (consultaAtual !== consultaCnpjId) return

    if (!empresa) {
      cnpjNaoEncontrado.value = cnpj
      formErrors.value.cnpj = 'Não foi encontrado nenhum cadastro para este CNPJ.'
      toast.warn('Não foi encontrado nenhum cadastro para este CNPJ.')
      return
    }

    const tipoLogradouro = getCnpjText(empresa.descricao_tipo_de_logradouro)
    const logradouro = getCnpjText(empresa.logradouro)
    const telefone = [empresa.ddd_telefone_1, empresa.ddd_telefone_2]
      .map(valor => onlyNumbers(getCnpjText(valor)))
      .find(valor => [10, 11].includes(valor.length)) ?? ''
    const cep = onlyNumbers(getCnpjText(empresa.cep))
    const dadosEmpresa: Record<TCampoCnpj, string> = {
      razaoSocial: getCnpjText(empresa.razao_social),
      nomeFantasia: getCnpjText(empresa.nome_fantasia),
      email: getCnpjText(empresa.email),
      telefone,
      cep: cep.length === 8 ? cep : '',
      logradouro: logradouro && tipoLogradouro && !logradouro.toUpperCase().startsWith(tipoLogradouro.toUpperCase() + ' ')
        ? tipoLogradouro + ' ' + logradouro : logradouro,
      numero: getCnpjText(empresa.numero),
      complemento: getCnpjText(empresa.complemento),
      bairro: getCnpjText(empresa.bairro),
      cidade: getCnpjText(empresa.municipio),
      uf: getCnpjText(empresa.uf),
    }

    if (dadosEmpresa.cep && formData.value.cep === valoresAnteriores.cep) {
      consultaCepId++
      loadingCep.value = false
    }

    for (const campo of camposCnpj) {
      // Não substituir alterações feitas enquanto a consulta estava em andamento.
      if (dadosEmpresa[campo] && formData.value[campo] === valoresAnteriores[campo]) {
        formData.value[campo] = dadosEmpresa[campo]
        dadosCnpjPreenchidos[campo] = dadosEmpresa[campo]
        delete formErrors.value[campo]
      }
    }

    cnpjConsultado.value = cnpj
    cnpjNaoEncontrado.value = ''
    toast.success('CNPJ confirmado. Confira os dados preenchidos e complete os campos restantes.')

    if (dadosCnpjPreenchidos.cep && formData.value.cep === dadosCnpjPreenchidos.cep)
      await consultarCep(true)
  } catch (error) {
    if (consultaAtual !== consultaCnpjId) return

    toast.error(normalizeError(error))
  } finally {
    if (consultaAtual === consultaCnpjId)
      loadingCnpj.value = false
  }
}

async function consultarCep(preencherSomenteVazios = false) {
  if (loadingCep.value) return

  const cep = onlyNumbers(formData.value.cep)

  if (cep.length !== 8) {
    formErrors.value.cep = 'Informe um CEP com 8 dígitos.'
    return
  }

  const consultaAtual = ++consultaCepId
  loadingCep.value = true
  mensagemCep.value = ''

  try {
    const endereco = await fetchCep(cep)

    if (consultaAtual !== consultaCepId) return

    if (!preencherSomenteVazios || !formData.value.logradouro) {
      formData.value.logradouro = endereco.logradouro

      if (preencherSomenteVazios)
        dadosCnpjPreenchidos.logradouro = endereco.logradouro
    }

    if (!preencherSomenteVazios || !formData.value.bairro) {
      formData.value.bairro = endereco.bairro

      if (preencherSomenteVazios)
        dadosCnpjPreenchidos.bairro = endereco.bairro
    }

    if (!preencherSomenteVazios || !formData.value.cidade) {
      formData.value.cidade = endereco.localidade

      if (preencherSomenteVazios)
        dadosCnpjPreenchidos.cidade = endereco.localidade
    }

    if (!preencherSomenteVazios || !formData.value.uf) {
      formData.value.uf = endereco.uf

      if (preencherSomenteVazios)
        dadosCnpjPreenchidos.uf = endereco.uf
    }

    for (const campo of ['cep', 'logradouro', 'bairro', 'cidade', 'uf'])
      delete formErrors.value[campo]
  } catch (error) {
    if (consultaAtual !== consultaCepId) return

    mensagemCep.value = normalizeError(error) + ' Preencha o endereço manualmente.'
    toast.warn(mensagemCep.value)
  } finally {
    if (consultaAtual === consultaCepId) {
      cepConsultado.value = cep
      loadingCep.value = false
    }
  }
}

function onSubmit(values: IFormPessoa) {
  if (loadingCep.value || loadingCnpj.value) return

  const errors: TGenericData = {}

  if (!values.bo_categ_cliente && !values.bo_categ_func)
    errors.bo_categ_cliente = 'Selecione pelo menos uma categoria.'

  if (values.tipo === 'PF') {
    if (!values.nome.trim())
      errors.nome = 'Campo obrigatório.'

    if (!validateCPF(values.cpf))
      errors.cpf = 'Informe um CPF válido.'
  } else {
    if (!values.razaoSocial.trim())
      errors.razaoSocial = 'Campo obrigatório.'

    if (!values.nomeFantasia.trim())
      errors.nomeFantasia = 'Campo obrigatório.'

    if (!validateCNPJ(values.cnpj))
      errors.cnpj = 'Informe um CNPJ válido.'
    else if (cnpjNaoEncontrado.value === unMaskDocument(values.cnpj).toUpperCase())
      errors.cnpj = 'Não foi encontrado nenhum cadastro para este CNPJ.'
  }

  if (!values.email.trim())
    errors.email = 'Campo obrigatório.'
  else if (!validateEmail(values.email.trim()))
    errors.email = 'Informe um e-mail válido.'

  if (!values.telefone.trim())
    errors.telefone = 'Campo obrigatório.'
  else if (!/^[0-9 ()+.-]+$/.test(values.telefone) || ![10, 11].includes(onlyNumbers(values.telefone).length))
    errors.telefone = 'Informe um telefone com DDD (10 ou 11 dígitos).'

  if (!/^\d{5}-?\d{3}$/.test(values.cep.trim()))
    errors.cep = 'Informe um CEP válido.'
  else if (cepConsultado.value !== onlyNumbers(values.cep))
    errors.cep = 'Consulte o CEP antes de gravar. Se a consulta falhar, preencha o endereço manualmente.'

  if (!values.logradouro.trim())
    errors.logradouro = 'Campo obrigatório.'

  if (!values.numero.trim())
    errors.numero = 'Campo obrigatório.'

  if (!values.bairro.trim())
    errors.bairro = 'Campo obrigatório.'

  if (!values.cidade.trim())
    errors.cidade = 'Campo obrigatório.'

  if (!ufs.includes(values.uf.trim().toUpperCase()))
    errors.uf = 'Informe uma UF válida.'

  if (values.bo_categ_func && (
    values.comissaoPercentual === null ||
    !Number.isFinite(values.comissaoPercentual) ||
    values.comissaoPercentual < 0 ||
    values.comissaoPercentual > 100
  ))
    errors.comissaoPercentual = 'A comissão deve estar entre 0% e 100%.'

  const documento = unMaskDocument(values.tipo === 'PF' ? values.cpf : values.cnpj).toUpperCase()
  const documentoDuplicado = props.pessoas.some(pessoa =>
    pessoa !== props.pessoa &&
    (props.pessoa?.id === undefined || pessoa.id !== props.pessoa.id) &&
    unMaskDocument(pessoa.tipo === 'PF' ? pessoa.cpf : pessoa.cnpj).toUpperCase() === documento
  )

  if (documentoDuplicado)
    errors[values.tipo === 'PF' ? 'cpf' : 'cnpj'] = 'Documento já cadastrado.'

  formErrors.value = errors
  isValidated.value = !Object.keys(errors).length

  if (!isValidated.value) return

  setLoading(true)

  try {
    const dadosPessoa = {
      ...(props.pessoa?.id !== undefined ? { id: props.pessoa.id } : {}),
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
        uf: values.uf.trim().toUpperCase(),
      },
      ...(values.bo_categ_func ? {
        cargo: values.cargo.trim(),
        comissaoPercentual: values.comissaoPercentual ?? 0,
      } : {}),
    }

    const pessoa: Pessoa = values.tipo === 'PF' ? {
      ...dadosPessoa,
      tipo: 'PF',
      nome: values.nome.trim(),
      cpf: documento,
    } : {
      ...dadosPessoa,
      tipo: 'PJ',
      razaoSocial: values.razaoSocial.trim(),
      nomeFantasia: values.nomeFantasia.trim(),
      cnpj: documento,
    }

    console.log(JSON.stringify(pessoa, null, 2))
    emit('validated', pessoa)
    toast.success('Dados validados. JSON gerado no console.')
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch([() => props.visible, () => props.pessoa], ([visible]) => {
  resetConsultaCnpj()
  consultaCepId++
  loadingCep.value = false

  if (!visible) return

  const pessoa = props.pessoa

  formData.value = pessoa ? {
    ...formDataDefault(),
    tipo: pessoa.tipo,
    bo_categ_cliente: pessoa.bo_categ_cliente,
    bo_categ_func: pessoa.bo_categ_func,
    bo_sts_reg: pessoa.bo_sts_reg,
    nome: pessoa.tipo === 'PF' ? pessoa.nome : '',
    cpf: pessoa.tipo === 'PF' ? maskCpf(pessoa.cpf) : '',
    cnpj: pessoa.tipo === 'PJ' ? maskCnpj(pessoa.cnpj) : '',
    razaoSocial: pessoa.tipo === 'PJ' ? pessoa.razaoSocial : '',
    nomeFantasia: pessoa.tipo === 'PJ' ? pessoa.nomeFantasia : '',
    email: pessoa.email,
    telefone: pessoa.telefone,
    cargo: pessoa.cargo ?? '',
    comissaoPercentual: pessoa.comissaoPercentual ?? 0,
    ...pessoa.endereco,
  } : formDataDefault()

  formErrors.value = {}
  isValidated.value = false
  mensagemCep.value = ''
  cepConsultado.value = ''
  formKey.value++
}, { immediate: true })

watch(() => formData.value.cep, () => {
  consultaCepId++
  loadingCep.value = false
  cepConsultado.value = ''
  mensagemCep.value = ''
}, { flush: 'sync' })

watch(() => formData.value.tipo, () => {
  resetConsultaCnpj()
  consultaCepId++
  loadingCep.value = false
  formErrors.value = {}
  isValidated.value = false
}, { flush: 'sync' })

watch(() => unMaskDocument(formData.value.cnpj).toUpperCase(), () => {
  resetConsultaCnpj(true)
  consultaCepId++
  loadingCep.value = false
  isValidated.value = false
}, { flush: 'sync' })

watch(() => [formData.value.bo_categ_cliente, formData.value.bo_categ_func], () => {
  delete formErrors.value.bo_categ_cliente
  isValidated.value = false

  if (!formData.value.bo_categ_func) {
    delete formErrors.value.cargo
    delete formErrors.value.comissaoPercentual
  }
})

</script>

<template>
  <CadastroDialog :visible="visible" @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar pessoa' : 'Cadastrar pessoa'" width="96rem"
    :disabled="loadingCep || loadingCnpj" @submit="formRef?.submit()">
    <FormPage ref="formRef" :key="formKey" novalidate class="flex flex-col gap-4"
      v-model:errors="formErrors" :initialValues="formData" @submit="onSubmit(formData)"
      @input="isValidated = false" @change="isValidated = false">
      <Fieldset legend="Dados principais">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="col-span-10 sm:col-span-6 lg:col-span-5" name="tipo" label="Tipo de pessoa">
            <SelectButton v-model="formData.tipo" :options="tiposPessoa"
              optionLabel="label" optionValue="value" :allowEmpty="false" />
          </FieldForm>
          <FieldForm class="col-span-2 col-start-11 row-start-1 lg:col-span-1 lg:col-start-12 flex items-end" name="bo_sts_reg" label="Status" v-slot="{ field }">
            <ToggleSwitch v-model="formData.bo_sts_reg" :name="field" aria-label="Pessoa ativa" />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4 lg:col-span-6" name="bo_categ_cliente" label="Categorias *" v-slot="{ invalid }">
            <div class="flex items-center flex-wrap gap-5 min-h-9">
              <div class="flex items-center gap-2">
                <Checkbox v-model="formData.bo_categ_cliente" name="bo_categ_cliente"
                  inputId="pessoa-cliente" binary :invalid="invalid" />
                <label for="pessoa-cliente">Cliente</label>
              </div>
              <div class="flex items-center gap-2">
                <Checkbox v-model="formData.bo_categ_func" name="bo_categ_func"
                  inputId="pessoa-funcionario" binary :invalid="invalid" />
                <label for="pessoa-funcionario">Funcionário</label>
              </div>
            </div>
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PF'" class="col-span-12 sm:col-span-8" name="nome" label="Nome completo *" v-slot="{ invalid, field }">
            <InputText v-model="formData.nome" :name="field" :invalid="invalid" fluid placeholder="Digite o nome completo" />
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PF'" class="col-span-12 sm:col-span-4" name="cpf" label="CPF *" v-slot="{ invalid, field }">
            <InputText v-model="formData.cpf" :name="field" :invalid="invalid" fluid maxlength="14" @update:modelValue="formData.cpf = maskCpf($event ?? '')" />
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PJ'" class="col-span-12 sm:col-span-6 lg:col-span-4" name="razaoSocial" label="Razão social *" v-slot="{ invalid, field }">
            <InputText v-model="formData.razaoSocial" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PJ'" class="col-span-12 sm:col-span-6 lg:col-span-4" name="nomeFantasia" label="Nome fantasia *" v-slot="{ invalid, field }">
            <InputText v-model="formData.nomeFantasia" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PJ'" class="col-span-12 sm:col-span-6 lg:col-span-4" name="cnpj" label="CNPJ *" v-slot="{ invalid, field }">
            <div class="flex gap-2">
              <InputText :modelValue="formData.cnpj" :name="field" :invalid="invalid" maxlength="18"
                class="flex-1 min-w-0" @update:modelValue="onCnpjChange" @blur="consultarCnpj()" />
              <Button type="button" icon="pi pi-search" aria-label="Consultar CNPJ"
                :loading="loadingCnpj" @click="consultarCnpj(true)" />
            </div>
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PJ'" class="col-span-12 sm:col-span-6 lg:col-span-4" name="telefone" label="Telefone *" v-slot="{ invalid, field }">
            <InputText v-model="formData.telefone" :name="field" :invalid="invalid" fluid type="tel" placeholder="(00) 00000-0000" />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-6 lg:col-span-4" name="email" label="E-mail *" v-slot="{ invalid, field }">
            <InputText v-model="formData.email" :name="field" :invalid="invalid" fluid type="email" placeholder="email@exemplo.com" />
          </FieldForm>
          <FieldForm v-if="formData.tipo === 'PF'" class="col-span-12 sm:col-span-6 lg:col-span-4" name="telefone" label="Telefone *" v-slot="{ invalid, field }">
            <InputText v-model="formData.telefone" :name="field" :invalid="invalid" fluid type="tel" placeholder="(00) 00000-0000" />
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset legend="Endereço">
        <div class="grid grid-cols-12 gap-x-4">
          <Message v-if="mensagemCep" severity="warn" class="col-span-12 mb-3">
            {{ mensagemCep }}
          </Message>
          <FieldForm class="col-span-12 sm:col-span-4 lg:col-span-3" name="cep" label="CEP *" v-slot="{ invalid, field }">
            <div class="flex gap-2">
              <InputText v-model="formData.cep" :name="field" placeholder="00000-000" maxlength="9"
                :invalid="invalid" class="flex-1 min-w-0" @blur="consultarCep()" />
              <Button type="button" icon="pi pi-search" aria-label="Consultar CEP"
                :loading="loadingCep" @click="consultarCep()" />
            </div>
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-8 lg:col-span-7" name="logradouro" label="Logradouro *" v-slot="{ invalid, field }">
            <InputText v-model="formData.logradouro" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-3 lg:col-span-2" name="numero" label="Número *" v-slot="{ invalid, field }">
            <InputText v-model="formData.numero" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-9 lg:col-span-3" name="complemento" label="Complemento" v-slot="{ invalid, field }">
            <InputText v-model="formData.complemento" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-5 lg:col-span-4" name="bairro" label="Bairro *" v-slot="{ invalid, field }">
            <InputText v-model="formData.bairro" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-5 lg:col-span-4" name="cidade" label="Cidade *" v-slot="{ invalid, field }">
            <InputText v-model="formData.cidade" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-2 lg:col-span-1" name="uf" label="UF *" v-slot="{ invalid, field }">
            <InputText v-model="formData.uf" :name="field" :invalid="invalid" fluid maxlength="2" />
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset v-if="isFuncionario" legend="Dados do funcionário">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="col-span-12 sm:col-span-8" name="cargo" label="Cargo" v-slot="{ field }">
            <InputText v-model="formData.cargo" :name="field" placeholder="Ex.: Mecânico" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="comissaoPercentual" label="Comissão (%)" v-slot="{ invalid, field }">
            <InputNumber v-model="formData.comissaoPercentual" :name="field" :min="0" :max="100"
              :maxFractionDigits="2" locale="pt-BR" :invalid="invalid" fluid />
          </FieldForm>
        </div>
      </Fieldset>
    </FormPage>
  </CadastroDialog>
</template>
