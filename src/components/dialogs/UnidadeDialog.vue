<script setup lang="ts">
import FloatLabel from 'primevue/floatlabel'
import type { IDialogProps } from '@/interface/dialog'
import type { IFormPageRef, TGenericData } from '@/interface/util'
import type { ICadUnidade, IFormUnidade } from '@/interface/pages/Unidade'
import { reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

import FormPage from '@/components/pages/FormPage.vue'
import config from '@/config/UnidadeDialogConfig.json'
import FieldForm from '@/components/field/FieldForm.vue'
import { useCatalogoStore as useCatalogStore } from '@/stores/catalogo.store'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'

const props = defineProps<IDialogProps>()
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [unit: ICadUnidade]
}>()

const catalogStore = useCatalogStore()
const { units: records } = storeToRefs(catalogStore)
const selectedUnit = ref<ICadUnidade | null>(null)
const loadingGrid = ref(false)
const utilStore = useUtilStore()
const { loading } = storeToRefs(utilStore)
const { normalizeError, setLoading, canWrite } = utilStore
const { showSuccess, showError } = useAppToast()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
function formDataDefault(): IFormUnidade {
  return {
    an_descr: '',
    ca_sigla: '',
  }
}

const formData = reactive<IFormUnidade>(formDataDefault())

function handleUnidade(unit: ICadUnidade | null) {
  selectedUnit.value = unit
  Object.assign(
    formData,
    unit ? { an_descr: unit.an_descr, ca_sigla: unit.ca_sigla } : formDataDefault(),
  )
  formErrors.value = {}
  formKey.value++
}

async function onSubmit(values: IFormUnidade) {
  const description = values.an_descr.trim()
  const abbreviation = values.ca_sigla.trim().toUpperCase()

  setLoading(true)
  try {
    const saved = await catalogStore.saveUnit({
      cn_unidade: selectedUnit.value?.cn_unidade,
      an_descr: description,
      ca_sigla: abbreviation,
    })
    emit('saved', saved)
    showSuccess('Processo realizado com sucesso.')
    emit('update:visible', false)
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

    handleUnidade(null)

    loadingGrid.value = true
    try {
      await catalogStore.loadUnitList()
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
    header="Unidades"
    modal
    :style="{ width: '42rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <FormPage
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
      <div class="mb-2 flex items-center justify-between gap-3">
        <h3 class="font-semibold">Dados da unidade</h3>
        <Button
          type="button"
          icon="pi pi-plus"
          aria-label="Limpar formulário"
          title="Limpar formulário"
          :disabled="loading || loadingGrid"
          @click="handleUnidade(null)"
        />
      </div>
      <div class="rounded-md border border-surface-200 p-5">
        <div class="grid grid-cols-3 gap-x-2">
          <FieldForm
            compact
            class="m-[4px] col-span-2 min-w-0"
            name="an_descr"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputText
                id="UnidadeDialog-an_descr"
                maxlength="4000"
                v-model="formData.an_descr"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label for="UnidadeDialog-an_descr">Descrição</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm compact class="m-[4px] min-w-0" name="ca_sigla" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText
                id="UnidadeDialog-ca_sigla"
                v-model="formData.ca_sigla"
                :name="field"
                :invalid="invalid"
                maxlength="10"
                fluid
              />
              <label for="UnidadeDialog-ca_sigla">Sigla</label>
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
      scrollHeight="14rem"
      class="mt-4"
    >
      <Column v-if="canWrite('CADASTROS')" header="Ações">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            aria-label="Editar unidade"
            @click="handleUnidade(data)"
          />
        </template>
      </Column>
      <Column field="an_descr" header="Descrição" />
      <Column field="ca_sigla" header="Sigla" />
    </DataTable>
    <template v-if="canWrite('CADASTROS')" #footer>
      <div class="flex w-full justify-end gap-2 border-t border-surface-200 pt-4">
        <Button
          type="button"
          label="Cancelar"
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
