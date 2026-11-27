<script setup lang="ts">
import FloatLabel from 'primevue/floatlabel'
import type { IDialogProps } from '@/interface/dialog'
import type { IFormPageRef, TGenericData } from '@/interface/util'
import type {
  ICadCategoriaServico,
  IFormCategoriaServico,
} from '@/interface/pages/CategoriaServico'
import { reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

import FormPage from '@/components/pages/FormPage.vue'
import config from '@/config/CategoriaServicoDialogConfig.json'
import FieldForm from '@/components/field/FieldForm.vue'
import { useCatalogoStore as useCatalogStore } from '@/stores/catalogo.store'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'
import { useConfirmacao } from '@/composables/useConfirmacao'

const props = defineProps<IDialogProps>()
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [category: ICadCategoriaServico]
}>()

const catalogStore = useCatalogStore()
const { serviceCategoryList: records } = storeToRefs(catalogStore)
const selectedCategory = ref<ICadCategoriaServico | null>(null)
const loadingGrid = ref(false)
const utilStore = useUtilStore()
const { loading } = storeToRefs(utilStore)
const { normalizeError, setLoading, canWrite } = utilStore
const { showSuccess, showError } = useAppToast()
const confirmar = useConfirmacao()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
function formDataDefault(): IFormCategoriaServico {
  return {
    an_descr: '',
  }
}

const formData = reactive<IFormCategoriaServico>(formDataDefault())

function handleCategoria(category: ICadCategoriaServico | null) {
  selectedCategory.value = category
  Object.assign(formData, category ? { an_descr: category.an_descr } : formDataDefault())
  formErrors.value = {}
  formKey.value++
}

function clearCode() {
  if (loading.value || loadingGrid.value) return
  handleCategoria(null)
}

async function onSubmit(values: IFormCategoriaServico) {
  if (loading.value || !(await confirmar())) return

  const description = values.an_descr.trim()

  setLoading(true)
  try {
    const saved = await catalogStore.saveServiceCategory({
      cn_categoria_servico: selectedCategory.value?.cn_categoria_servico,
      an_descr: description,
    })
    handleCategoria(saved)
    emit('saved', saved)
    showSuccess('Processo realizado com sucesso.')
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return

    handleCategoria(null)

    loadingGrid.value = true
    try {
      await catalogStore.loadServiceCategoryList()
    } catch (error) {
      showError(normalizeError(error))
    } finally {
      loadingGrid.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    header="Categorias de serviços"
    modal
    contentClass="flex min-h-0 flex-1 flex-col"
    :contentStyle="{ scrollbarWidth: 'none' }"
    :style="{ width: '48rem', height: '34rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <FormPage
      class="shrink-0"
      v-if="canWrite('CADASTROS')"
      ref="formRef"
      :key="formKey"
      novalidate
      v-model:errors="formErrors"
      :initialValues="formData"
      :modelValues="formData"
      :fields="config.fields"
      @submit="onSubmit"
    >
      <div class="rounded-md border border-surface-200 p-5">
        <div class="grid grid-cols-12 gap-x-2">
          <div class="m-[4px] col-span-12 sm:col-span-3">
            <FloatLabel variant="on" class="min-w-0 flex-1">
              <InputText
                id="CategoriaServicoDialog-cn_categoria_servico"
                :modelValue="
                  selectedCategory?.cn_categoria_servico == null
                    ? ''
                    : String(selectedCategory?.cn_categoria_servico)
                "
                readonly
                fluid
                @keydown.delete.prevent="clearCode"
                @keydown.backspace.prevent="clearCode"
              />
              <label for="CategoriaServicoDialog-cn_categoria_servico">Código</label>
            </FloatLabel>
          </div>
          <FieldForm
            compact
            class="m-[4px] col-span-12 min-w-0 sm:col-span-9"
            name="an_descr"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                id="CategoriaServicoDialog-an_descr"
                maxlength="4000"
                v-model="formData.an_descr"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label for="CategoriaServicoDialog-an_descr">Descrição</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </div>
    </FormPage>
    <DataTable
      :value="records"
      :loading="loadingGrid"
      size="small"
      scrollable
      scrollHeight="flex"
      class="mt-4 min-h-24 flex-1"
    >
      <Column v-if="canWrite('CADASTROS')" header="Ações">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            aria-label="Editar categoria"
            @click="handleCategoria(data)"
          />
        </template>
      </Column>
      <Column
        field="cn_categoria_servico"
        header="Código"
        style="width: 72px"
        bodyStyle="text-align: right"
      />
      <Column field="an_descr" header="Descrição" />
    </DataTable>
    <template v-if="canWrite('CADASTROS')" #footer>
      <div class="flex w-full justify-end gap-2 border-t border-surface-200 pt-4">
        <Button
          type="button"
          label="Fechar"
          severity="secondary"
          :disabled="loading"
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
