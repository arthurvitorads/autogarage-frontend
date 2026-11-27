<script setup lang="ts">
import type { IManutOrdemServicoDialogProps } from '@/interface/pages/OrdemServicoPage'
import type { ICadPessoa, IAdmOrdemServico, IClassificacaoOrdemServico } from '@/interface/tables'
import FloatLabel from 'primevue/floatlabel'
import Fieldset from 'primevue/fieldset'
import { ServiceOrderModel } from '@/models/service-order.model'
import type { IFormPageRef } from '@/interface/util'
import { useConfirmacao as useConfirmation } from '@/composables/useConfirmacao'
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import MultiSelect from 'primevue/multiselect'
import DatePicker from 'primevue/datepicker'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

import Dialog from 'primevue/dialog'
import FormPage from '@/components/pages/FormPage.vue'
import config from '@/config/OrdemServicoPageConfig.json'
import FieldForm from '@/components/field/FieldForm.vue'
import ManutPessoaDialog from '@/components/dialogs/ManutPessoaDialog.vue'
import CadastroVeiculoDialog from '@/components/dialogs/CadastroVeiculoDialog.vue'
import ClassificacaoOrdemServicoDialog from '@/components/dialogs/ClassificacaoOrdemServicoDialog.vue'
import OrdemEvidencias from '@/components/pages/OrdemEvidencias.vue'
import {
  anexarEvidencia,
  gravarDescricaoEvidencia,
  getOrderCustomer,
  getOrderEmployees,
  getVehicleCatalog,
  getOrderEvidences,
  lookupOrderPlate,
} from '@/services/ordem-api.service'
import { maskCpf, maskCnpj, maskTelefone } from '@/services/util.service'
import type { TSaleCustomer } from '@/interface/pages/VendaPage'

import type {
  IFormOrdemServico,
  IMarcaVeiculo,
  IManutOrdemServico,
  IServiceOrderEmployee,
  IServiceOrderEvidence,
  IServiceOrderEvidenceInput,
} from '@/interface/pages/OrdemServicoPage'
import type { TGenericData } from '@/interface/util'

import {
  dataHoraLocal as localDateTime,
  normalizarPlaca as normalizePlate,
  mascararPlaca,
  placaValida,
  validarDadosOrdem as validateOrderData,
} from '@/services/ordem-servico.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'

const props = defineProps<IManutOrdemServicoDialogProps>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [ordem: IAdmOrdemServico]
}>()

const orderStore = useServiceOrderStore()
const { clientes: customers, classificacoes: classifications } = storeToRefs(orderStore)
const { saveOrdem: saveOrder } = orderStore
const { normalizeError, setLoading, canWrite } = useUtilStore()
const { loading } = storeToRefs(useUtilStore())
const { showSuccess, showError, showWarn } = useAppToast()
const confirmAction = useConfirmation()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
const personDialogVisible = ref(false)
const classificationDialogVisible = ref(false)
const marcaVeiculoVisible = ref(false)
const modeloVeiculoVisible = ref(false)
const ordemAtual = ref<IAdmOrdemServico | null>(null)
const gravandoEvidencia = ref(false)
const maxYear = new Date().getFullYear() + 1
const customerOptions = computed(() =>
  customers.value.map((customer) => ({
    ...customer,
    an_label: customer.an_nome ?? customer.an_razao_social ?? '',
  })),
)

const formData = reactive<IFormOrdemServico>(ServiceOrderModel.createForm())

const customerDetails = ref<TSaleCustomer | null>(null)
const employees = ref<IServiceOrderEmployee[]>([])
const savedEvidences = ref<IServiceOrderEvidence[]>([])
const evidenceInput = ref<HTMLInputElement | null>(null)
const evidenceQueue = ref<IServiceOrderEvidenceInput[]>([])
const evidenceEditIndex = ref<number | null>(null)
const evidenceDraft = ref<IServiceOrderEvidenceInput | null>(null)
const evidencias = computed(() => [...savedEvidences.value, ...pendingEvidences.value])
const pendingEvidences = ref<IServiceOrderEvidenceInput[]>([])
const evidenceLoading = ref(false)
const readingFiles = ref(false)
const plateLoading = ref(false)
const informationTab = ref('observacoes')
const evidenceLimit = 5
const evidenceSize = 1024 * 1024
const imageTypes = ['image/jpeg', 'image/png', 'image/webp']

const employeeOptions = computed(() => {
  const assigned = ordemAtual.value?.responsaveis ?? []
  return [
    ...employees.value,
    ...assigned.filter(
      (person) => !employees.value.some((employee) => employee.cn_pessoa === person.cn_pessoa),
    ),
  ].map((person) => ({
    ...person,
    label: person.an_cargo ? person.an_nome + ' - ' + person.an_cargo : person.an_nome,
  }))
})
const catalogoVeiculos = ref<IMarcaVeiculo[]>([])
const marcasVeiculo = computed(() => catalogoVeiculos.value.map((marca) => marca.an_marca))
const marcaSelecionada = computed(() =>
  catalogoVeiculos.value.find(
    (marca) => marca.an_marca.toLowerCase() === formData.an_marca.trim().toLowerCase(),
  ),
)
const modelosVeiculo = computed(
  () => marcaSelecionada.value?.modelos.map((modelo) => modelo.an_descr) ?? [],
)

function selecionarCadastroVeiculo(catalogo: IMarcaVeiculo[], marca: string, modelo?: string) {
  const modeloAtual = formData.an_modelo
  catalogoVeiculos.value = catalogo
  alterarMarca(marca)
  if (modelo) formData.an_modelo = modelo
  else if (modelosVeiculo.value.includes(modeloAtual)) formData.an_modelo = modeloAtual
}

const dataEntrada = computed(() => (formData.dt_entrada ? new Date(formData.dt_entrada) : null))
const dataPrevisao = computed(() => (formData.dt_previsao ? new Date(formData.dt_previsao) : null))
const responsavelLegado = computed(() =>
  ordemAtual.value?.responsaveis?.length ? '' : ordemAtual.value?.an_responsavel,
)

function alterarMarca(marca: string | null) {
  const nome = marca ?? ''
  if (formData.an_marca.trim().toLowerCase() !== nome.trim().toLowerCase()) formData.an_modelo = ''
  formData.an_marca = nome
}

const customerName = computed(
  () => customerDetails.value?.an_nome ?? customerDetails.value?.an_razao_social ?? '',
)
const customerDocument = computed(() =>
  customerDetails.value?.ca_cpf
    ? maskCpf(customerDetails.value.ca_cpf)
    : maskCnpj(customerDetails.value?.ca_cnpj ?? ''),
)
const customerAddress = computed(() => {
  const address = customerDetails.value?.endereco
  return address
    ? [address.an_logradouro, address.an_numero, address.an_cidade, address.estado?.ca_uf]
        .filter(Boolean)
        .join(', ')
    : ''
})

watch([() => props.visible, () => formData.cn_pessoa], async ([visible, id], _, onCleanup) => {
  customerDetails.value = null
  if (!visible || id === null) return
  let current = true
  onCleanup(() => {
    current = false
  })
  try {
    const { dados } = await getOrderCustomer(id)
    if (current) customerDetails.value = dados
  } catch (error) {
    if (current) showError(normalizeError(error))
  }
})

function selectNewPerson(person: ICadPessoa) {
  if (!person.bo_sts_reg || !person.bo_categ_cliente) return
  if (
    !customers.value.some((customer) => String(customer.cn_pessoa) === String(person.cn_pessoa))
  ) {
    const { cn_pessoa, ca_tipo, an_nome, an_razao_social, ca_cpf, ca_cnpj } = person
    customers.value = [
      ...customers.value,
      { cn_pessoa, ca_tipo, an_nome, an_razao_social, ca_cpf, ca_cnpj },
    ]
  }
  formData.cn_pessoa = person.cn_pessoa
}

function selectClassification(item: IClassificacaoOrdemServico) {
  formData.cn_classificacao_os = item.cn_classificacao_os
}

function selectDate(
  field: 'dt_entrada' | 'dt_previsao',
  value: Date | (Date | null)[] | null | undefined,
) {
  formData[field] = value instanceof Date ? localDateTime(value.toISOString()) : ''
}

function alterarPlaca(event: Event) {
  const campo = event.target as HTMLInputElement
  const placa = mascararPlaca(campo.value)
  if (campo.value !== placa) campo.value = placa
  formData.an_placa = placa
}

async function findPlate() {
  const plate = normalizePlate(formData.an_placa)
  if (!placaValida(plate)) {
    formErrors.value.an_placa = 'Informe uma placa válida.'
    return
  }
  const version = formKey.value
  plateLoading.value = true
  try {
    const { dados } = await lookupOrderPlate(plate)
    if (!props.visible || version !== formKey.value || normalizePlate(formData.an_placa) !== plate)
      return
    if (!dados) {
      showWarn('Placa não encontrada na base de veículos Preencha os dados do veículo.')
      return
    }
    Object.assign(formData, dados, { an_placa: mascararPlaca(plate) })
  } catch (error) {
    if (props.visible && version === formKey.value) showError(normalizeError(error))
  } finally {
    if (version === formKey.value) plateLoading.value = false
  }
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.onload = () => resolve(String(reader.result).split(',', 2)[1] ?? '')
    reader.readAsDataURL(file)
  })
}

function selectEvidences(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  return adicionarEvidencias(files)
}

function soltarEvidencias(event: DragEvent) {
  return adicionarEvidencias(Array.from(event.dataTransfer?.files ?? []))
}

function editarEvidencia(index: number) {
  const image = evidencias.value[index]
  if (!image) return
  evidenceEditIndex.value = index
  evidenceDraft.value = { ...image }
}

function cancelarEvidencia() {
  evidenceQueue.value = []
  evidenceEditIndex.value = null
  evidenceDraft.value = null
}

async function confirmarEvidencia() {
  const image = evidenceDraft.value
  if (!image || gravandoEvidencia.value) return
  const index = evidenceEditIndex.value
  const an_descr = image.an_descr.trim()
  const ordem = ordemAtual.value
  const version = formKey.value
  gravandoEvidencia.value = true

  try {
    if (index === null) {
      if (ordem) {
        const { dados } = await anexarEvidencia(ordem.cn_ordem, { ...image, an_descr })
        if (!props.visible || version !== formKey.value) return
        savedEvidences.value.push(dados)
        showSuccess('Processo realizado com sucesso.')
      } else {
        pendingEvidences.value.push({ ...image, an_descr })
      }
      evidenceDraft.value = evidenceQueue.value.shift() ?? null
      return
    }

    const saved = savedEvidences.value[index]
    if (saved && ordem) {
      const { dados } = await gravarDescricaoEvidencia(ordem.cn_ordem, saved.cn_evidencia, an_descr)
      if (!props.visible || version !== formKey.value) return
      saved.an_descr = dados.an_descr
    } else {
      const evidence = evidencias.value[index]
      if (evidence) evidence.an_descr = an_descr
    }
    cancelarEvidencia()
  } catch (error) {
    if (props.visible && version === formKey.value) showError(normalizeError(error))
  } finally {
    gravandoEvidencia.value = false
  }
}

async function adicionarEvidencias(files: File[]) {
  if (
    !files.length ||
    loading.value ||
    readingFiles.value ||
    evidenceLoading.value ||
    evidenceDraft.value
  )
    return
  if (files.length + savedEvidences.value.length + pendingEvidences.value.length > evidenceLimit) {
    showWarn('Uma ordem pode ter até cinco imagens.')
    return
  }
  if (
    files.some(
      (file) => !imageTypes.includes(file.type) || file.size === 0 || file.size > evidenceSize,
    )
  ) {
    showWarn('Selecione imagens JPEG, PNG ou WebP de até 1 MB cada.')
    return
  }
  const version = formKey.value
  readingFiles.value = true
  try {
    const images = await Promise.all(
      files.map(async (file) => ({
        an_nome: file.name,
        an_descr: '',
        ca_mime: file.type,
        bl_imagem: await readImage(file),
      })),
    )
    if (props.visible && version === formKey.value) {
      evidenceDraft.value = images.shift() ?? null
      evidenceQueue.value = images
    }
  } catch (error) {
    if (props.visible && version === formKey.value) showError(normalizeError(error))
  } finally {
    if (version === formKey.value) readingFiles.value = false
  }
}

function validateForm(values: IFormOrdemServico) {
  const errors = validateOrderData(values)

  if (!customers.value.some((customer) => String(customer.cn_pessoa) === String(values.cn_pessoa)))
    errors.cn_pessoa = 'Selecione um cliente ativo disponível.'

  if (
    !classifications.value.some((item) => item.cn_classificacao_os === values.cn_classificacao_os)
  )
    errors.cn_classificacao_os = 'Selecione uma classificação válida.'

  return errors
}

async function onSubmit(values: IFormOrdemServico) {
  if (readingFiles.value || !(await confirmAction())) return

  setLoading(true)

  try {
    if (values.cn_pessoa === null || values.cn_classificacao_os === null) return

    const data: IManutOrdemServico = {
      ...(ordemAtual.value ? { cn_ordem: ordemAtual.value.cn_ordem } : {}),
      cn_pessoa: values.cn_pessoa,
      cn_classificacao_os: values.cn_classificacao_os,
      dt_entrada: new Date(values.dt_entrada).toISOString(),
      dt_previsao: values.dt_previsao ? new Date(values.dt_previsao).toISOString() : null,
      ...(responsavelLegado.value && !values.cn_responsaveis.length
        ? {}
        : { cn_responsaveis: values.cn_responsaveis }),
      evidencias: pendingEvidences.value,
      an_placa: normalizePlate(values.an_placa),
      an_marca: values.an_marca.trim(),
      an_modelo: values.an_modelo.trim(),
      nu_ano: values.nu_ano,
      an_cor: values.an_cor.trim(),
      qt_quilometragem: values.qt_quilometragem,
      an_solicitacao: values.an_solicitacao.trim(),
      an_obs: values.an_obs.trim(),
    }
    const version = formKey.value
    const result = await saveOrder(data)
    if (!props.visible || version !== formKey.value) {
      emit('saved', result)
      return
    }
    ordemAtual.value = result
    const atualizarEvidencias = pendingEvidences.value.length > 0
    pendingEvidences.value = []
    emit('saved', result)
    showSuccess('Processo realizado com sucesso.')
    if (atualizarEvidencias) {
      evidenceLoading.value = true
      try {
        const { dados } = await getOrderEvidences(result.cn_ordem)
        if (props.visible && version === formKey.value) savedEvidences.value = dados
      } finally {
        if (version === formKey.value) evidenceLoading.value = false
      }
    }
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(
  [() => props.visible, () => props.order],
  async ([visible], _, onCleanup) => {
    if (!visible) return
    let current = true
    onCleanup(() => {
      current = false
    })

    const order = props.order
    ordemAtual.value = order ?? null

    Object.assign(formData, ServiceOrderModel.createForm())
    if (order) {
      Object.assign(formData, {
        cn_pessoa: order.cn_pessoa,
        cn_classificacao_os: order.cn_classificacao_os,
        dt_entrada: localDateTime(order.dt_entrada),
        dt_previsao: order.dt_previsao ? localDateTime(order.dt_previsao) : '',
        cn_responsaveis: order.responsaveis?.map((person) => person.cn_pessoa) ?? [],
        an_placa: mascararPlaca(order.an_placa),
        an_marca: order.an_marca,
        an_modelo: order.an_modelo,
        nu_ano: order.nu_ano,
        an_cor: order.an_cor,
        qt_quilometragem: order.qt_quilometragem,
        an_solicitacao: order.an_solicitacao,
        an_obs: order.an_obs,
      })
    }
    formErrors.value = {}
    formKey.value++
    informationTab.value = 'observacoes'
    employees.value = []
    catalogoVeiculos.value = []
    savedEvidences.value = []
    cancelarEvidencia()
    pendingEvidences.value = []
    readingFiles.value = false
    plateLoading.value = false
    evidenceLoading.value = !!order

    const results = await Promise.allSettled([
      getOrderEmployees(),
      getVehicleCatalog(),
      order ? getOrderEvidences(order.cn_ordem) : null,
    ])
    if (!current) return
    const [employeeResult, catalogResult, evidenceResult] = results
    if (employeeResult.status === 'fulfilled') employees.value = employeeResult.value.dados
    if (catalogResult.status === 'fulfilled') catalogoVeiculos.value = catalogResult.value.dados
    if (evidenceResult.status === 'fulfilled')
      savedEvidences.value = evidenceResult.value?.dados ?? []
    evidenceLoading.value = false
    for (const result of results)
      if (result.status === 'rejected') showError(normalizeError(result.reason))
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="ordemAtual ? 'Editar O.S.' : 'Nova O.S.'"
    modal
    :closeOnEscape="!personDialogVisible && !classificationDialogVisible"
    contentClass="min-h-0 flex-1"
    :style="{
      width: '96rem',
      maxWidth: '95vw',
      height: 'min(70rem, calc(100dvh - 8px))',
      minHeight: 'min(70rem, calc(100dvh - 8px))',
      maxHeight: 'calc(100dvh - 8px)',
    }"
  >
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      class="flex flex-col gap-4"
      v-model:errors="formErrors"
      revalidateErrors
      :initialValues="formData"
      :modelValues="formData"
      :fields="config.fields"
      :validate="validateForm"
      @submit="onSubmit"
    >
      <Fieldset legend="Dados do cliente">
        <dl
          class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          :class="{ 'opacity-50': !customerDetails }"
          :aria-disabled="!customerDetails"
        >
          <div class="min-w-0">
            <dt class="text-sm text-surface-500">Nome</dt>
            <dd class="min-h-5 break-words">{{ customerName }}</dd>
          </div>
          <div class="min-w-0">
            <dt class="text-sm text-surface-500">CPF ou CNPJ</dt>
            <dd class="min-h-5 break-words">{{ customerDocument }}</dd>
          </div>
          <div class="min-w-0">
            <dt class="text-sm text-surface-500">Telefone</dt>
            <dd class="min-h-5 break-words">
              {{ maskTelefone(customerDetails?.an_telefone ?? '') }}
            </dd>
          </div>
          <div class="min-w-0">
            <dt class="text-sm text-surface-500">E-mail</dt>
            <dd class="min-h-5 break-words">{{ customerDetails?.an_email ?? '' }}</dd>
          </div>
          <div class="min-w-0 sm:col-span-2">
            <dt class="text-sm text-surface-500">Endereço</dt>
            <dd class="min-h-5 break-words">{{ customerAddress }}</dd>
          </div>
        </dl>
      </Fieldset>
      <Fieldset legend="Dados gerais">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="m-[4px] col-span-12 md:col-span-4"
            name="cn_pessoa"
            v-slot="{ invalid, field }"
          >
            <div class="flex items-start gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <Select
                  inputId="ManutOrdemServicoDialog-cn_pessoa"
                  v-model="formData.cn_pessoa"
                  :name="field"
                  :options="customerOptions"
                  optionLabel="an_label"
                  optionValue="cn_pessoa"
                  :invalid="invalid"
                  filter
                  :filterFields="['an_label']"
                  fluid
                  emptyMessage="Nenhum cliente disponível."
                  emptyFilterMessage="Nenhum cliente corresponde à pesquisa."
                />
                <label for="ManutOrdemServicoDialog-cn_pessoa">Cliente</label>
              </FloatLabel>
              <Button
                v-if="canWrite('CADASTROS')"
                type="button"
                icon="pi pi-plus"
                aria-label="Cadastrar pessoa"
                title="Cadastrar pessoa"
                @click="personDialogVisible = true"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 md:col-span-4"
            name="cn_classificacao_os"
            v-slot="{ invalid, field }"
          >
            <div class="flex items-start gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <Select
                  inputId="ManutOrdemServicoDialog-cn_classificacao_os"
                  v-model="formData.cn_classificacao_os"
                  :name="field"
                  :options="classifications"
                  optionLabel="an_descr"
                  optionValue="cn_classificacao_os"
                  :invalid="invalid"
                  fluid
                />
                <label for="ManutOrdemServicoDialog-cn_classificacao_os">Classificação</label>
              </FloatLabel>
              <Button
                v-if="canWrite('CADASTROS')"
                type="button"
                icon="pi pi-plus"
                aria-label="Cadastrar classificação"
                title="Cadastrar classificação"
                @click="classificationDialogVisible = true"
              />
            </div>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 md:col-span-4" name="cn_responsaveis">
            <FloatLabel variant="on">
              <MultiSelect
                inputId="ManutOrdemServicoDialog-cn_responsaveis"
                v-model="formData.cn_responsaveis"
                :options="employeeOptions"
                optionLabel="label"
                optionValue="cn_pessoa"
                :maxSelectedLabels="2"
                selectedItemsLabel="{0} responsáveis"
                filter
                fluid
                emptyMessage="Nenhum funcionário disponível."
              />
              <label for="ManutOrdemServicoDialog-cn_responsaveis">Responsáveis</label>
            </FloatLabel>
            <small v-if="responsavelLegado && !formData.cn_responsaveis.length">
              Responsável registrado: {{ responsavelLegado }}
            </small>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6"
            name="dt_entrada"
            v-slot="{ invalid }"
          >
            <FloatLabel variant="on">
              <DatePicker
                inputId="ManutOrdemServicoDialog-dt_entrada"
                :modelValue="dataEntrada"
                :invalid="invalid"
                dateFormat="dd/mm/yy"
                showTime
                showIcon
                hourFormat="24"
                :manualInput="false"
                fluid
                @update:modelValue="selectDate('dt_entrada', $event)"
              />
              <label for="ManutOrdemServicoDialog-dt_entrada">Entrada</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6"
            name="dt_previsao"
            v-slot="{ invalid }"
          >
            <FloatLabel variant="on">
              <DatePicker
                inputId="ManutOrdemServicoDialog-dt_previsao"
                :modelValue="dataPrevisao"
                showClear
                :invalid="invalid"
                dateFormat="dd/mm/yy"
                showTime
                showIcon
                hourFormat="24"
                :manualInput="false"
                fluid
                @update:modelValue="selectDate('dt_previsao', $event)"
              />
              <label for="ManutOrdemServicoDialog-dt_previsao">Previsão de entrega</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset legend="Dados do veículo">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="m-[4px] col-span-12 sm:col-span-3" name="an_placa" v-slot="{ invalid }">
            <div class="flex gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <input
                  id="ManutOrdemServicoDialog-an_placa"
                  :value="formData.an_placa"
                  class="p-inputtext p-component w-full"
                  :class="{ 'p-filled': formData.an_placa, 'p-invalid': invalid }"
                  :aria-invalid="invalid"
                  autocapitalize="characters"
                  autocomplete="off"
                  spellcheck="false"
                  @input="alterarPlaca"
                />
                <label for="ManutOrdemServicoDialog-an_placa">Placa</label>
              </FloatLabel>
              <Button
                type="button"
                icon="pi pi-search"
                aria-label="Consultar placa"
                v-tooltip.top="'Pesquisa na base de veículos cadastrados.'"
                :loading="plateLoading"
                @click="findPlate"
              />
            </div>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-4" name="an_marca" v-slot="{ invalid }">
            <div class="flex gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <Select
                  inputId="ManutOrdemServicoDialog-an_marca"
                  :modelValue="marcaSelecionada?.an_marca ?? formData.an_marca"
                  :options="marcasVeiculo"
                  filter
                  @update:modelValue="alterarMarca($event)"
                  :invalid="invalid"
                  fluid
                />
                <label for="ManutOrdemServicoDialog-an_marca">Marca</label>
              </FloatLabel>
              <Button
                v-if="canWrite('CADASTROS')"
                type="button"
                icon="pi pi-plus"
                aria-label="Cadastrar marca de veículo"
                @click="marcaVeiculoVisible = true"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-5"
            name="an_modelo"
            v-slot="{ invalid }"
          >
            <div class="flex gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <Select
                  inputId="ManutOrdemServicoDialog-an_modelo"
                  :modelValue="
                    modelosVeiculo.find(
                      (modelo) => modelo.toLowerCase() === formData.an_modelo.toLowerCase(),
                    ) ?? formData.an_modelo
                  "
                  :options="modelosVeiculo"
                  :disabled="!marcaSelecionada"
                  filter
                  @update:modelValue="formData.an_modelo = $event ?? ''"
                  :invalid="invalid"
                  fluid
                />
                <label for="ManutOrdemServicoDialog-an_modelo">Modelo</label>
              </FloatLabel>
              <Button
                v-if="canWrite('CADASTROS')"
                type="button"
                icon="pi pi-plus"
                aria-label="Cadastrar modelo de veículo"
                @click="modeloVeiculoVisible = true"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-4"
            name="nu_ano"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputNumber
                inputId="ManutOrdemServicoDialog-nu_ano"
                v-model="formData.nu_ano"
                :name="field"
                :invalid="invalid"
                :min="1900"
                :max="maxYear"
                :useGrouping="false"
                fluid
              />
              <label for="ManutOrdemServicoDialog-nu_ano">Ano</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-4" name="an_cor" v-slot="{ field }">
            <FloatLabel variant="on">
              <InputText
                id="ManutOrdemServicoDialog-an_cor"
                maxlength="4000"
                v-model="formData.an_cor"
                :name="field"
                fluid
              />
              <label for="ManutOrdemServicoDialog-an_cor">Cor</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-4"
            name="qt_quilometragem"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputNumber
                inputId="ManutOrdemServicoDialog-qt_quilometragem"
                v-model="formData.qt_quilometragem"
                :name="field"
                :invalid="invalid"
                :min="0"
                :max="9999999"
                locale="pt-BR"
                fluid
              />
              <label for="ManutOrdemServicoDialog-qt_quilometragem">Quilometragem</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </Fieldset>
      <hr class="border-surface-200" />
      <section>
        <h3 class="mb-2 font-semibold">Informações</h3>
        <Tabs v-model:value="informationTab">
          <TabList>
            <Tab value="observacoes">Observações</Tab>
            <Tab value="evidencias">Evidências</Tab>
          </TabList>
          <TabPanels class="h-44">
            <TabPanel value="observacoes">
              <div class="grid grid-cols-12 gap-x-4">
                <FieldForm
                  class="m-[4px] col-span-12 sm:col-span-6"
                  name="an_solicitacao"
                  v-slot="{ field }"
                >
                  <FloatLabel variant="on">
                    <Textarea
                      id="ManutOrdemServicoDialog-an_solicitacao"
                      maxlength="4000"
                      v-model="formData.an_solicitacao"
                      :name="field"
                      class="h-36 resize-none"
                      fluid
                    />
                    <label for="ManutOrdemServicoDialog-an_solicitacao"
                      >Solicitação do cliente</label
                    >
                  </FloatLabel>
                </FieldForm>
                <FieldForm
                  class="m-[4px] col-span-12 sm:col-span-6"
                  name="an_obs"
                  v-slot="{ field }"
                >
                  <FloatLabel variant="on">
                    <Textarea
                      id="ManutOrdemServicoDialog-an_obs"
                      maxlength="4000"
                      v-model="formData.an_obs"
                      :name="field"
                      class="h-36 resize-none"
                      fluid
                    />
                    <label for="ManutOrdemServicoDialog-an_obs">Observações internas</label>
                  </FloatLabel>
                </FieldForm>
              </div>
            </TabPanel>
            <TabPanel value="evidencias">
              <div class="flex h-36 flex-col justify-center">
                <input
                  ref="evidenceInput"
                  type="file"
                  :accept="imageTypes.join(',')"
                  class="hidden"
                  multiple
                  @change="selectEvidences"
                />
                <p v-if="evidenceLoading">Carregando evidências...</p>
                <template v-else>
                  <button
                    v-if="!evidencias.length"
                    type="button"
                    class="flex h-full w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-surface-400 p-2 text-sm text-surface-600 hover:border-primary hover:text-primary disabled:opacity-50"
                    :disabled="loading || readingFiles"
                    @click="evidenceInput?.click()"
                    @dragover.prevent
                    @drop.prevent="soltarEvidencias"
                  >
                    <i class="pi pi-cloud-upload text-2xl" aria-hidden="true" />
                    <span>{{
                      readingFiles
                        ? 'Carregando imagens...'
                        : 'Arraste e solte imagens aqui ou clique para selecionar'
                    }}</span>
                    <small>Até cinco imagens JPEG, PNG ou WebP de até 1 MB cada.</small>
                  </button>
                  <OrdemEvidencias
                    v-else
                    :images="evidencias"
                    :removableFrom="savedEvidences.length"
                    compact
                    @edit="editarEvidencia"
                    @remove="pendingEvidences.splice($event - savedEvidences.length, 1)"
                  >
                    <li v-if="evidencias.length < evidenceLimit" class="shrink-0">
                      <Button
                        type="button"
                        icon="pi pi-plus"
                        aria-label="Adicionar imagens"
                        :disabled="loading"
                        :loading="readingFiles"
                        @click="evidenceInput?.click()"
                        @dragover.prevent
                        @drop.prevent="soltarEvidencias"
                      />
                    </li>
                  </OrdemEvidencias>
                </template>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </section>
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
          :disabled="loading || readingFiles || evidenceLoading"
          :loading="loading"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </Dialog>
  <Dialog
    :visible="!!evidenceDraft"
    :header="evidenceEditIndex === null ? 'Adicionar evidência' : 'Editar descrição'"
    :closable="!gravandoEvidencia"
    :closeOnEscape="!gravandoEvidencia"
    modal
    :style="{ width: '28rem', maxWidth: '95vw' }"
    @update:visible="!$event && cancelarEvidencia()"
  >
    <form
      v-if="evidenceDraft"
      id="form-evidencia-os"
      class="flex flex-col gap-3"
      @submit.prevent="confirmarEvidencia"
    >
      <p class="break-all font-semibold">{{ evidenceDraft.an_nome }}</p>
      <label for="evidencia-os-descricao">Descrição</label>
      <Textarea
        id="evidencia-os-descricao"
        v-model="evidenceDraft.an_descr"
        placeholder="Descrição opcional"
        rows="3"
        maxlength="500"
        fluid
      />
    </form>
    <template #footer>
      <Button
        type="button"
        label="Cancelar"
        severity="secondary"
        :disabled="gravandoEvidencia"
        @click="cancelarEvidencia"
      />
      <Button
        type="submit"
        form="form-evidencia-os"
        label="Confirmar"
        :loading="gravandoEvidencia"
      />
    </template>
  </Dialog>
  <ManutPessoaDialog v-model:visible="personDialogVisible" @on-save="selectNewPerson" />
  <CadastroVeiculoDialog
    v-model:visible="marcaVeiculoVisible"
    tipo="marca"
    @saved="(catalogo, registro) => selecionarCadastroVeiculo(catalogo, registro.an_marca)"
  />
  <CadastroVeiculoDialog
    v-model:visible="modeloVeiculoVisible"
    tipo="modelo"
    :marca-inicial="marcaSelecionada?.cn_marca_veiculo"
    @saved="
      (catalogo, registro) =>
        selecionarCadastroVeiculo(catalogo, registro.an_marca, registro.an_descr)
    "
  />
  <ClassificacaoOrdemServicoDialog
    v-model:visible="classificationDialogVisible"
    @saved="selectClassification"
  />
</template>
