<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'

import CadastroDialog from '@/components/dialogs/CadastroDialog.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type { IFormItemOrdemServico, TItemOrdemServico, TManutItemOrdemServico, TCodigoOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'
import type { TGenericData } from '@/interface/util'

import { calcularTotalItemOrdem, formatCurrencyOrdem, isPrecoOrdemValido } from '@/services/ordem-servico.service'
import { isQuantidadeValida } from '@/services/estoque.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { useCatalogoStore } from '@/stores/catalogo.store'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'

const props = defineProps<{
  visible: boolean
  codigoOrdem: TCodigoOrdemServico
  item?: TItemOrdemServico | null
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: []
}>()

const { produtos, servicos } = storeToRefs(useCatalogoStore())
const { saveItem } = useOrdemServicoStore()
const { normalizeError, setLoading } = useUtilStore()
const toast = useAppToast()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<{ submit: () => void } | null>(null)
const tiposItem = [
  { label: 'Produto', value: 'PRODUTO' },
  { label: 'Serviço', value: 'SERVICO' },
]

function formDataDefault(): IFormItemOrdemServico {
  return {
    ca_tipo: 'PRODUTO',
    cn_referencia: null,
    qt_quantidade: 1,
    vl_unitario: 0,
  }
}

const formData = ref<IFormItemOrdemServico>(formDataDefault())
const options = computed(() => formData.value.ca_tipo === 'PRODUTO'
  ? produtos.value.filter(produto => produto.bo_sts_reg).map(produto => ({
    cn_referencia: produto.cn_produto, an_nome: produto.an_nome,
    ca_unidade: produto.ca_unidade, vl_preco: produto.vl_venda,
  }))
  : servicos.value.filter(servico => servico.bo_sts_reg).map(servico => ({
    cn_referencia: servico.cn_servico, an_nome: servico.an_nome,
    ca_unidade: '', vl_preco: servico.vl_preco,
  })))
const selectReferencia = computed(() => options.value.find(item => item.cn_referencia === formData.value.cn_referencia))
const totalItem = computed(() => {
  if (formData.value.qt_quantidade === null || formData.value.vl_unitario === null) return null

  try {
    return calcularTotalItemOrdem(formData.value.qt_quantidade, formData.value.vl_unitario)
  } catch {
    return null
  }
})

function changeTipo() {
  formData.value.cn_referencia = null
  formData.value.vl_unitario = 0
  formErrors.value = {}
}

function loadPreco() {
  formData.value.vl_unitario = selectReferencia.value?.vl_preco ?? 0
  delete formErrors.value.cn_referencia
  delete formErrors.value.vl_unitario
}

function onSubmit(values: IFormItemOrdemServico) {
  const errors: TGenericData = {}

  if (!selectReferencia.value) errors.cn_referencia = 'Selecione um produto ou serviço ativo.'

  if (!isQuantidadeValida(values.qt_quantidade) || values.qt_quantidade === 0)
    errors.qt_quantidade = 'Informe uma quantidade maior que zero, com até três casas decimais.'

  if (!isPrecoOrdemValido(values.vl_unitario))
    errors.vl_unitario = 'Informe um preço válido, com até duas casas decimais.'

  if (!errors.qt_quantidade && !errors.vl_unitario && values.qt_quantidade !== null && values.vl_unitario !== null) {
    try {
      calcularTotalItemOrdem(values.qt_quantidade, values.vl_unitario)
    } catch (error) {
      errors.vl_unitario = normalizeError(error)
    }
  }

  formErrors.value = errors
  if (Object.keys(errors).length) return

  setLoading(true)

  try {
    if (values.cn_referencia === null || values.qt_quantidade === null || values.vl_unitario === null) return

    const dadosBase = {
      cn_ordem_servico: props.codigoOrdem,
      ...(props.item ? { cn_item: props.item.cn_item } : {}),
      qt_quantidade: values.qt_quantidade,
      vl_unitario: values.vl_unitario,
    }
    const dados: TManutItemOrdemServico = values.ca_tipo === 'PRODUTO'
      ? { ...dadosBase, ca_tipo: 'PRODUTO', cn_produto: values.cn_referencia }
      : { ...dadosBase, ca_tipo: 'SERVICO', cn_servico: values.cn_referencia }

    saveItem(dados)
    console.log(JSON.stringify(dados, null, 2))
    emit('saved')
    toast.success('Item registrado nesta ordem. JSON gerado no console.')
    emit('update:visible', false)
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch([() => props.visible, () => props.item], ([visible]) => {
  if (!visible) return

  const item = props.item

  formData.value = item ? {
    ca_tipo: item.ca_tipo,
    cn_referencia: item.ca_tipo === 'PRODUTO' ? item.cn_produto : item.cn_servico,
    qt_quantidade: item.qt_quantidade,
    vl_unitario: item.vl_unitario,
  } : formDataDefault()

  formErrors.value = {}
  formKey.value++
}, { immediate: true })
</script>

<template>
  <CadastroDialog :visible="visible" @update:visible="emit('update:visible', $event)"
    :header="item ? 'Editar item da ordem' : 'Adicionar produto ou serviço'" width="64rem" @submit="formRef?.submit()">
    <FormPage ref="formRef" :key="formKey" novalidate v-model:errors="formErrors" :initialValues="formData" @submit="onSubmit(formData)">
      <Fieldset legend="Dados do item">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="col-span-12" name="ca_tipo" label="Tipo">
            <SelectButton v-model="formData.ca_tipo" :options="tiposItem" optionLabel="label" optionValue="value"
              :allowEmpty="false" @change="changeTipo" />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-9" name="cn_referencia"
            :label="formData.ca_tipo === 'PRODUTO' ? 'Produto *' : 'Serviço *'" v-slot="{ invalid, field }">
            <Select v-model="formData.cn_referencia" :name="field" :options="options" optionLabel="an_nome"
              optionValue="cn_referencia" placeholder="Selecione" :invalid="invalid" filter fluid @change="loadPreco" />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-3" name="ca_unidade" label="Unidade">
            <InputText :modelValue="selectReferencia?.ca_unidade || '—'" readonly fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="qt_quantidade" label="Quantidade *" v-slot="{ invalid, field }">
            <InputNumber v-model="formData.qt_quantidade" :name="field" :invalid="invalid" :min="0"
              :max="999999999.999" :maxFractionDigits="3" locale="pt-BR" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="vl_unitario" label="Preço unitário *" v-slot="{ invalid, field }">
            <InputNumber v-model="formData.vl_unitario" :name="field" :invalid="invalid" :min="0"
              :max="999999999.99" mode="currency" currency="BRL" locale="pt-BR" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="vl_total" label="Total do item">
            <InputText :modelValue="totalItem === null ? '—' : formatCurrencyOrdem(totalItem)" readonly fluid />
          </FieldForm>
        </div>
      </Fieldset>
    </FormPage>
  </CadastroDialog>
</template>
