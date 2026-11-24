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
import ClassificacaoOrdemServicoDialog from '@/components/dialogs/ClassificacaoOrdemServicoDialog.vue'
import OrdemEvidencias from '@/components/pages/OrdemEvidencias.vue'
import {
  getOrderCustomer,
  getOrderEmployees,
  getOrderEvidences,
  lookupOrderPlate,
} from '@/services/ordem-api.service'
import { maskCpf, maskCnpj, maskTelefone } from '@/services/util.service'
import type { TSaleCustomer } from '@/interface/pages/VendaPage'

import type {
  IFormOrdemServico,
  IManutOrdemServico,
  IServiceOrderEmployee,
  IServiceOrderEvidenceInput,
} from '@/interface/pages/OrdemServicoPage'
import type { TGenericData } from '@/interface/util'

import {
  dataHoraLocal as localDateTime,
  normalizarPlaca as normalizePlate,
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
const {
  clientes: customers,
  classificacoes: classifications,
  classificacaoPadrao: defaultClassification,
} = storeToRefs(orderStore)
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
const isEditing = computed(() => !!props.order)
const maxYear = new Date().getFullYear() + 1
const customerOptions = computed(() =>
  customers.value.map((customer) => ({
    ...customer,
    an_label: customer.an_nome ?? customer.an_razao_social ?? '',
  })),
)

const formData = reactive<IFormOrdemServico>(
  ServiceOrderModel.createForm(defaultClassification.value?.cn_classificacao_os ?? null),
)

const customerDetails = ref<TSaleCustomer | null>(null)
const employees = ref<IServiceOrderEmployee[]>([])
const savedEvidences = ref<IServiceOrderEvidenceInput[]>([])
const pendingEvidences = ref<IServiceOrderEvidenceInput[]>([])
const evidenceLoading = ref(false)
const readingFiles = ref(false)
const plateLoading = ref(false)
const informationTab = ref('observacoes')
const evidenceLimit = 5
const evidenceSize = 1024 * 1024
const imageTypes = ['image/jpeg', 'image/png', 'image/webp']

const employeeOptions = computed(() => {
  const order = props.order
  if (
    order?.cn_responsavel &&
    !employees.value.some((person) => person.cn_pessoa === String(order.cn_responsavel))
  )
    return [
      ...employees.value,
      { cn_pessoa: String(order.cn_responsavel), an_nome: order.an_responsavel },
    ]
  return employees.value
})

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
  delete formErrors.value.cn_pessoa
}

function selectClassification(item: IClassificacaoOrdemServico) {
  formData.cn_classificacao_os = item.cn_classificacao_os
  delete formErrors.value.cn_classificacao_os
}

function selectDate(
  field: 'dt_entrada' | 'dt_previsao',
  value: Date | (Date | null)[] | null | undefined,
) {
  formData[field] = value instanceof Date ? localDateTime(value.toISOString()) : ''
  delete formErrors.value[field]
}

async function findPlate() {
  const plate = normalizePlate(formData.an_placa)
  if (!/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(plate)) {
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
      showWarn('Placa não encontrada no histórico de O.S. Preencha os dados do veículo.')
      return
    }
    Object.assign(formData, dados)
    for (const field of ['an_placa', 'an_marca', 'an_modelo', 'nu_ano', 'an_cor'])
      delete formErrors.value[field]
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

async function selectEvidences(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length || readingFiles.value) return
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
        ca_mime: file.type,
        bl_imagem: await readImage(file),
      })),
    )
    if (props.visible && version === formKey.value) pendingEvidences.value.push(...images)
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
      ...(props.order ? { cn_ordem_servico: props.order.cn_ordem_servico } : {}),
      cn_pessoa: values.cn_pessoa,
      cn_classificacao_os: values.cn_classificacao_os,
      dt_entrada: new Date(values.dt_entrada).toISOString(),
      dt_previsao: values.dt_previsao ? new Date(values.dt_previsao).toISOString() : null,
      cn_responsavel:
        props.order?.an_responsavel &&
        props.order.cn_responsavel == null &&
        values.cn_responsavel === null
          ? undefined
          : values.cn_responsavel,
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
    const result = await saveOrder(data)
    emit('saved', result)
    showSuccess('Processo realizado com sucesso.')
    emit('update:visible', false)
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

    Object.assign(
      formData,
      ServiceOrderModel.createForm(defaultClassification.value?.cn_classificacao_os ?? null),
    )
    if (order) {
      Object.assign(formData, {
        cn_pessoa: order.cn_pessoa,
        cn_classificacao_os: order.cn_classificacao_os,
        dt_entrada: localDateTime(order.dt_entrada),
        dt_previsao: order.dt_previsao ? localDateTime(order.dt_previsao) : '',
        cn_responsavel: order.cn_responsavel == null ? null : String(order.cn_responsavel),
        an_placa: order.an_placa,
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
    savedEvidences.value = []
    pendingEvidences.value = []
    readingFiles.value = false
    plateLoading.value = false
    evidenceLoading.value = !!order

    const results = await Promise.allSettled([
      getOrderEmployees(),
      order ? getOrderEvidences(order.cn_ordem_servico) : null,
    ])
    if (!current) return
    const [employeeResult, evidenceResult] = results
    if (employeeResult.status === 'fulfilled') employees.value = employeeResult.value.dados
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
    :header="isEditing ? 'Editar ordem de serviço' : 'Nova ordem de serviço'"
    modal
    :closeOnEscape="!personDialogVisible && !classificationDialogVisible"
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
          <FieldForm
            class="m-[4px] col-span-12 md:col-span-4"
            name="cn_responsavel"
            v-slot="{ field }"
          >
            <FloatLabel variant="on">
              <Select
                inputId="ManutOrdemServicoDialog-cn_responsavel"
                v-model="formData.cn_responsavel"
                :name="field"
                :options="employeeOptions"
                optionLabel="an_nome"
                optionValue="cn_pessoa"
                filter
                showClear
                fluid
                emptyMessage="Nenhum funcionário disponível."
              />
              <label for="ManutOrdemServicoDialog-cn_responsavel">Responsável</label>
            </FloatLabel>
            <small
              v-if="
                order?.an_responsavel &&
                order.cn_responsavel == null &&
                formData.cn_responsavel === null
              "
            >
              Responsável registrado: {{ order.an_responsavel }}
            </small>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6"
            name="dt_entrada"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <DatePicker
                inputId="ManutOrdemServicoDialog-dt_entrada"
                :modelValue="formData.dt_entrada ? new Date(formData.dt_entrada) : null"
                :name="field"
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
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <DatePicker
                inputId="ManutOrdemServicoDialog-dt_previsao"
                :modelValue="formData.dt_previsao ? new Date(formData.dt_previsao) : null"
                :name="field"
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
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-3"
            name="an_placa"
            v-slot="{ invalid, field }"
          >
            <div class="flex gap-2">
              <FloatLabel variant="on" class="min-w-0 flex-1">
                <InputText
                  id="ManutOrdemServicoDialog-an_placa"
                  v-model="formData.an_placa"
                  :name="field"
                  :invalid="invalid"
                  maxlength="8"
                  fluid
                  @update:modelValue="formData.an_placa = ($event ?? '').toUpperCase()"
                />
                <label for="ManutOrdemServicoDialog-an_placa">Placa</label>
              </FloatLabel>
              <Button
                type="button"
                icon="pi pi-search"
                aria-label="Consultar placa no histórico"
                v-tooltip.top="'Pesquisa na base de veículos cadastrados nas ordens de serviço.'"
                :loading="plateLoading"
                @click="findPlate"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-4"
            name="an_marca"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                id="ManutOrdemServicoDialog-an_marca"
                maxlength="4000"
                v-model="formData.an_marca"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label for="ManutOrdemServicoDialog-an_marca">Marca</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-5"
            name="an_modelo"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                id="ManutOrdemServicoDialog-an_modelo"
                maxlength="4000"
                v-model="formData.an_modelo"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label for="ManutOrdemServicoDialog-an_modelo">Modelo</label>
            </FloatLabel>
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
          <TabPanels>
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
                      rows="2"
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
                      rows="2"
                      fluid
                    />
                    <label for="ManutOrdemServicoDialog-an_obs">Observações internas</label>
                  </FloatLabel>
                </FieldForm>
              </div>
            </TabPanel>
            <TabPanel value="evidencias">
              <div class="flex flex-col gap-3 py-3">
                <label class="flex flex-col gap-1">
                  Selecionar imagens
                  <input
                    type="file"
                    :accept="imageTypes.join(',')"
                    multiple
                    :disabled="
                      loading ||
                      readingFiles ||
                      evidenceLoading ||
                      savedEvidences.length + pendingEvidences.length >= evidenceLimit
                    "
                    @change="selectEvidences"
                  />
                  <small>Até cinco imagens JPEG, PNG ou WebP de até 1 MB cada.</small>
                </label>
                <p v-if="evidenceLoading">Carregando evidências...</p>
                <OrdemEvidencias v-if="savedEvidences.length" :images="savedEvidences" />
                <OrdemEvidencias
                  v-if="pendingEvidences.length"
                  :images="pendingEvidences"
                  removable
                  @remove="pendingEvidences.splice($event, 1)"
                />
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
  <ManutPessoaDialog v-model:visible="personDialogVisible" @on-save="selectNewPerson" />
  <ClassificacaoOrdemServicoDialog
    v-model:visible="classificationDialogVisible"
    @saved="selectClassification"
  />
</template>
