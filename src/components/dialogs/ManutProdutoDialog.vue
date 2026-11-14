<script setup lang="ts">
import type { IManutProductDialogProps } from '@/interface/pages/ProdutoPage'
import type { IAdmCadastroAuxiliar } from '@/interface/tables'
import FloatLabel from 'primevue/floatlabel'
import { ProductModel } from '@/models/product.model'
import type { IFormPageRef } from '@/interface/util'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import StatusField from '@/components/field/StatusField.vue'
import Button from 'primevue/button'

import Dialog from 'primevue/dialog'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'
import CategoriaProdutoDialog from '@/components/dialogs/CategoriaProdutoDialog.vue'
import MarcaDialog from '@/components/dialogs/MarcaDialog.vue'
import UnidadeDialog from '@/components/dialogs/UnidadeDialog.vue'

import type { IFormProduct, IManutProduct } from '@/interface/pages/ProdutoPage'
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

const { showSuccess, showError } = useAppToast()
const catalogStore = useCatalogStore()
const { saveProduto: saveProduct } = catalogStore
const {
  categoriasProduto: productCategories,
  marcasProduto: productBrands,
  unidadesProduto: productUnits,
} = storeToRefs(catalogStore)
const { normalizeError, setLoading } = useUtilStore()
const { loading } = storeToRefs(useUtilStore())

const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
const isValidated = ref(false)
const isEditing = computed(() => !!props.product)
const categoryDialogVisible = ref(false)
const brandDialogVisible = ref(false)
const unitDialogVisible = ref(false)

function selectCategory(category: IAdmCadastroAuxiliar) {
  formData.value.an_categoria = category.an_descr
  delete formErrors.value.an_categoria
}

function selectBrand(brand: IAdmCadastroAuxiliar) {
  formData.value.an_marca = brand.an_descr
  delete formErrors.value.an_marca
}

function selectUnit(unit: IAdmCadastroAuxiliar) {
  formData.value.ca_unidade = unit.ca_sigla
  delete formErrors.value.ca_unidade
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
    showSuccess('Processo realizado com sucesso.')
    emit('update:visible', false)
  } catch (error) {
    showError(normalizeError(error))
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
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar produto' : 'Novo produto'"
    modal
    :style="{ width: '84rem', maxWidth: '95vw', maxHeight: '90vh' }"
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
            class="m-[4px] col-span-12 sm:col-span-10"
            name="an_nome"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                id="ManutProdutoDialog-an_nome"
                maxlength="4000"
                v-model="formData.an_nome"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label for="ManutProdutoDialog-an_nome">Nome *</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-2 flex items-start" name="bo_sts_reg">
            <StatusField v-model="formData.bo_sts_reg" />
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-3"
            name="an_referencia"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                id="ManutProdutoDialog-an_referencia"
                maxlength="4000"
                v-model="formData.an_referencia"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label for="ManutProdutoDialog-an_referencia">Referência / código interno</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-3"
            name="an_categoria"
            v-slot="{ invalid, field }"
          >
            <div class="flex gap-2">
              <FloatLabel variant="on" class="flex-1 min-w-0">
                <Select
                  inputId="ManutProdutoDialog-an_categoria"
                  v-model="formData.an_categoria"
                  :name="field"
                  :options="productCategories"
                  :invalid="invalid"
                  showClear
                  fluid
                />
                <label for="ManutProdutoDialog-an_categoria">Categoria</label>
              </FloatLabel>
              <Button
                type="button"
                icon="pi pi-plus"
                severity="secondary"
                aria-label="Cadastrar categoria"
                @click="categoryDialogVisible = true"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-3"
            name="an_marca"
            v-slot="{ invalid, field }"
          >
            <div class="flex gap-2">
              <FloatLabel variant="on" class="flex-1 min-w-0">
                <Select
                  inputId="ManutProdutoDialog-an_marca"
                  v-model="formData.an_marca"
                  :name="field"
                  :options="productBrands"
                  :invalid="invalid"
                  showClear
                  fluid
                />
                <label for="ManutProdutoDialog-an_marca">Marca</label>
              </FloatLabel>
              <Button
                type="button"
                icon="pi pi-plus"
                severity="secondary"
                aria-label="Cadastrar marca"
                @click="brandDialogVisible = true"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-3"
            name="ca_unidade"
            v-slot="{ invalid, field }"
          >
            <div class="flex gap-2">
              <FloatLabel variant="on" class="flex-1 min-w-0">
                <Select
                  inputId="ManutProdutoDialog-ca_unidade"
                  v-model="formData.ca_unidade"
                  :name="field"
                  :options="productUnits"
                  :invalid="invalid"
                  optionLabel="label"
                  optionValue="value"
                  fluid
                />
                <label for="ManutProdutoDialog-ca_unidade">Unidade *</label>
              </FloatLabel>
              <Button
                type="button"
                icon="pi pi-plus"
                severity="secondary"
                aria-label="Cadastrar unidade"
                @click="unitDialogVisible = true"
              />
            </div>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-3"
            name="vl_custo"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputNumber
                inputId="ManutProdutoDialog-vl_custo"
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
              <label for="ManutProdutoDialog-vl_custo">Preço de custo</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-3"
            name="vl_venda"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputNumber
                inputId="ManutProdutoDialog-vl_venda"
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
              <label for="ManutProdutoDialog-vl_venda">Preço de venda</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 lg:col-span-6" name="an_obs" v-slot="{ field }">
            <FloatLabel variant="on">
              <Textarea
                id="ManutProdutoDialog-an_obs"
                maxlength="4000"
                v-model="formData.an_obs"
                :name="field"
                rows="2"
                fluid
              />
              <label for="ManutProdutoDialog-an_obs">Observações</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset legend="Dados do estoque">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6"
            name="qt_estoque"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputNumber
                inputId="ManutProdutoDialog-qt_estoque"
                v-model="formData.qt_estoque"
                :name="field"
                :invalid="invalid"
                fluid
                locale="pt-BR"
                :max="999999999.999"
                :min="0"
                :maxFractionDigits="3"
              />
              <label for="ManutProdutoDialog-qt_estoque">Quantidade em estoque</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6"
            name="qt_estoque_min"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputNumber
                inputId="ManutProdutoDialog-qt_estoque_min"
                v-model="formData.qt_estoque_min"
                :name="field"
                :invalid="invalid"
                fluid
                locale="pt-BR"
                :max="999999999.999"
                :min="0"
                :maxFractionDigits="3"
              />
              <label for="ManutProdutoDialog-qt_estoque_min">Estoque mínimo</label>
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
  <CategoriaProdutoDialog v-model:visible="categoryDialogVisible" @saved="selectCategory" />
  <MarcaDialog v-model:visible="brandDialogVisible" @saved="selectBrand" />
  <UnidadeDialog v-model:visible="unitDialogVisible" @saved="selectUnit" />
</template>
