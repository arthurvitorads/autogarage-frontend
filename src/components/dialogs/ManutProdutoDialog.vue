<script setup lang="ts">
import { ProductModel } from '@/models/product.model'
import type { IFormPageRef } from '@/interface/util'
import type { IManutProductDialogProps } from '@/interface/dialog'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import StatusField from '@/components/field/StatusField.vue'
import Button from 'primevue/button'

import CadastroDialog from '@/components/dialogs/CadastroDialog.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'
import CadastroAuxiliarDialog from '@/components/dialogs/CadastroAuxiliarDialog.vue'

import type {
  IAdmProduto,
  IFormProduct,
  IManutProduct,
} from '@/interface/interface-pages/ProdutoPage'
import type {
  IAdmCadastroAuxiliar,
  TAuxiliaryType,
} from '@/interface/interface-pages/CadastroAuxiliar'
import type { TGenericData } from '@/interface/util'

import { isQuantidadeValida as isValidQuantity } from '@/services/estoque.service'
import { normalizeString } from '@/services/util.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { useCatalogoStore as useCatalogStore } from '@/stores/catalogo.store'

const props = defineProps<IManutProductDialogProps>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [produto: IManutProduct]
}>()

const toast = useAppToast()
const catalogStore = useCatalogStore()
const { saveProduto: saveProduct } = catalogStore
const {
  categoriasProduto: productCategories,
  marcasProduto: productBrands,
  unidadesProduto: productUnits,
} = storeToRefs(catalogStore)
const { normalizeError, setLoading } = useUtilStore()

const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
const isValidated = ref(false)
const isEditing = computed(() => !!props.product)
const auxiliaryDialogVisible = ref(false)
const auxiliaryType = ref<TAuxiliaryType>('CATEGORIA_PRODUTO')

function newAuxiliary(tipo: TAuxiliaryType) {
  auxiliaryType.value = tipo
  auxiliaryDialogVisible.value = true
}

function selectAuxiliary(auxiliary: IAdmCadastroAuxiliar) {
  if (auxiliary.ca_tipo === 'CATEGORIA_PRODUTO') {
    formData.value.an_categoria = auxiliary.an_descr
    delete formErrors.value.an_categoria
  }

  if (auxiliary.ca_tipo === 'MARCA') {
    formData.value.an_marca = auxiliary.an_descr
    delete formErrors.value.an_marca
  }

  if (auxiliary.ca_tipo === 'UNIDADE') {
    formData.value.ca_unidade = auxiliary.ca_sigla
    delete formErrors.value.ca_unidade
  }
}

const formData = ref<IFormProduct>(ProductModel.createForm())

async function onSubmit(values: IFormProduct) {
  const errors: TGenericData = {}

  if (!values.an_nome.trim()) errors.an_nome = 'Campo obrigatório.'

  if (values.an_categoria && !productCategories.value.includes(values.an_categoria))
    errors.an_categoria = 'Selecione uma categoria.'

  if (values.an_marca && !productBrands.value.includes(values.an_marca))
    errors.an_marca = 'Selecione uma marca.'

  if (!productUnits.value.some((unidade) => unidade.value === values.ca_unidade))
    errors.ca_unidade = 'Selecione uma unidade.'

  for (const field of ['vl_custo', 'vl_venda'] as const) {
    const value = values[field]

    if (
      value === null ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 999_999_999.99 ||
      Math.abs(value * 100 - Math.round(value * 100)) > 0.000001
    )
      errors[field] = 'Informe um valor válido, com até duas casas decimais.'
  }

  if (!isValidQuantity(values.qt_estoque))
    errors.qt_estoque = 'Informe uma quantidade de estoque válida, com até três casas decimais.'

  if (!isValidQuantity(values.qt_estoque_min))
    errors.qt_estoque_min = 'Informe um estoque mínimo válido, com até três casas decimais.'

  if (
    values.an_referencia.trim() &&
    props.products.some(
      (product) =>
        product.cn_produto !== props.product?.cn_produto &&
        normalizeString(product.an_referencia) === normalizeString(values.an_referencia),
    )
  )
    errors.an_referencia = 'Referência já cadastrada.'

  formErrors.value = errors
  isValidated.value = !Object.keys(errors).length

  if (!isValidated.value) return

  setLoading(true)

  try {
    const product: IManutProduct = {
      ...(props.product ? { cn_produto: props.product.cn_produto } : {}),
      an_nome: values.an_nome.trim(),
      an_referencia: values.an_referencia.trim(),
      an_categoria: values.an_categoria ?? '',
      an_marca: values.an_marca ?? '',
      ca_unidade: values.ca_unidade,
      vl_custo: values.vl_custo ?? 0,
      vl_venda: values.vl_venda ?? 0,
      qt_estoque_min: values.qt_estoque_min ?? 0,
      qt_estoque: values.qt_estoque ?? 0,
      an_obs: values.an_obs.trim(),
      bo_sts_reg: values.bo_sts_reg,
    }

    await saveProduct(product)
    emit('saved', product)
    toast.success('Processo realizado com sucesso.')
    emit('update:visible', false)
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(
  [() => props.visible, () => props.product],
  ([visible]) => {
    if (!visible) return

    const product = props.product

    formData.value = product
      ? {
          an_nome: product.an_nome,
          an_referencia: product.an_referencia,
          an_categoria: product.an_categoria,
          an_marca: product.an_marca,
          ca_unidade: product.ca_unidade,
          vl_custo: product.vl_custo,
          vl_venda: product.vl_venda,
          qt_estoque: product.qt_estoque,
          qt_estoque_min: product.qt_estoque_min,
          an_obs: product.an_obs,
          bo_sts_reg: product.bo_sts_reg,
        }
      : ProductModel.createForm()
    formErrors.value = {}
    isValidated.value = false
    formKey.value++
  },
  { immediate: true },
)
</script>

<template>
  <CadastroDialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar produto' : 'Novo produto'"
    width="84rem"
    @submit="formRef?.submit()"
  >
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      class="flex flex-col gap-4"
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit(formData)"
      @input="isValidated = false"
      @change="isValidated = false"
    >
      <Fieldset legend="Dados principais">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="col-span-12 sm:col-span-10"
            name="an_nome"
            label="Nome *"
            v-slot="{ invalid, field }"
          >
            <InputText
              maxlength="4000"
              v-model="formData.an_nome"
              :name="field"
              :invalid="invalid"
              fluid
              placeholder="Digite o nome do produto"
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-2 flex items-start"
            name="bo_sts_reg"
            label="Status"
          >
            <StatusField v-model="formData.bo_sts_reg" />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-6 lg:col-span-3"
            name="an_referencia"
            label="Referência / código interno"
            v-slot="{ invalid, field }"
          >
            <InputText
              maxlength="4000"
              v-model="formData.an_referencia"
              :name="field"
              :invalid="invalid"
              fluid
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-6 lg:col-span-3"
            name="an_categoria"
            label="Categoria"
            v-slot="{ invalid, field }"
          >
            <div class="flex gap-2">
              <Select
                v-model="formData.an_categoria"
                :name="field"
                :options="productCategories"
                :invalid="invalid"
                class="flex-1 min-w-0"
                placeholder="Selecione"
                showClear
              />
              <Button
                type="button"
                icon="pi pi-plus"
                severity="secondary"
                aria-label="Cadastrar categoria"
                @click="newAuxiliary('CATEGORIA_PRODUTO')"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-6 lg:col-span-3"
            name="an_marca"
            label="Marca"
            v-slot="{ invalid, field }"
          >
            <div class="flex gap-2">
              <Select
                v-model="formData.an_marca"
                :name="field"
                :options="productBrands"
                :invalid="invalid"
                class="flex-1 min-w-0"
                placeholder="Selecione"
                showClear
              />
              <Button
                type="button"
                icon="pi pi-plus"
                severity="secondary"
                aria-label="Cadastrar marca"
                @click="newAuxiliary('MARCA')"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-6 lg:col-span-3"
            name="ca_unidade"
            label="Unidade *"
            v-slot="{ invalid, field }"
          >
            <div class="flex gap-2">
              <Select
                v-model="formData.ca_unidade"
                :name="field"
                :options="productUnits"
                :invalid="invalid"
                class="flex-1 min-w-0"
                placeholder="Selecione"
                optionLabel="label"
                optionValue="value"
              />
              <Button
                type="button"
                icon="pi pi-plus"
                severity="secondary"
                aria-label="Cadastrar unidade"
                @click="newAuxiliary('UNIDADE')"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-6 lg:col-span-3"
            name="vl_custo"
            label="Preço de custo"
            v-slot="{ invalid, field }"
          >
            <InputNumber
              v-model="formData.vl_custo"
              :name="field"
              :invalid="invalid"
              fluid
              locale="pt-BR"
              mode="currency"
              currency="BRL"
              :max="999999999.99"
              :min="0"
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-6 lg:col-span-3"
            name="vl_venda"
            label="Preço de venda"
            v-slot="{ invalid, field }"
          >
            <InputNumber
              v-model="formData.vl_venda"
              :name="field"
              :invalid="invalid"
              fluid
              locale="pt-BR"
              mode="currency"
              currency="BRL"
              :max="999999999.99"
              :min="0"
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 lg:col-span-6"
            name="an_obs"
            label="Observações"
            v-slot="{ field }"
          >
            <Textarea maxlength="4000" v-model="formData.an_obs" :name="field" rows="2" fluid />
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset legend="Dados do estoque">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="col-span-12 sm:col-span-6"
            name="qt_estoque"
            label="Quantidade em estoque"
            v-slot="{ invalid, field }"
          >
            <InputNumber
              v-model="formData.qt_estoque"
              :name="field"
              :invalid="invalid"
              fluid
              locale="pt-BR"
              :max="999999999.999"
              :min="0"
              :maxFractionDigits="3"
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-6"
            name="qt_estoque_min"
            label="Estoque mínimo"
            v-slot="{ invalid, field }"
          >
            <InputNumber
              v-model="formData.qt_estoque_min"
              :name="field"
              :invalid="invalid"
              fluid
              locale="pt-BR"
              :max="999999999.999"
              :min="0"
              :maxFractionDigits="3"
            />
          </FieldForm>
        </div>
      </Fieldset>
    </FormPage>
  </CadastroDialog>
  <CadastroAuxiliarDialog
    v-model:visible="auxiliaryDialogVisible"
    :auxiliaryType="auxiliaryType"
    @saved="selectAuxiliary"
  />
</template>
