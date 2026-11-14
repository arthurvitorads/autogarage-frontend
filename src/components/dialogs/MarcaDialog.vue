<script setup lang="ts">
import type { IAdmCadastroAuxiliar } from '@/interface/tables'
import FloatLabel from 'primevue/floatlabel'
import { AuxiliaryModel } from '@/models/auxiliary.model'
import type { IDialogProps } from '@/interface/dialog'
import type { IFormPageRef, TGenericData } from '@/interface/util'
import type { IFormDescricao } from '@/interface/pages/CadastroAuxiliar'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'

import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'
import { useCatalogoStore as useCatalogStore } from '@/stores/catalogo.store'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'

const props = defineProps<IDialogProps>()
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [brand: IAdmCadastroAuxiliar]
}>()

const catalogStore = useCatalogStore()
const { cadastrosAuxiliares } = storeToRefs(catalogStore)
const records = computed(() =>
  cadastrosAuxiliares.value.filter((record) => record.ca_tipo === 'MARCA'),
)
const selectedBrand = ref<IAdmCadastroAuxiliar | null>(null)
const loadingGrid = ref(false)
const utilStore = useUtilStore()
const { loading } = storeToRefs(utilStore)
const { normalizeError, setLoading, canWrite } = utilStore
const { showSuccess, showError } = useAppToast()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
const formData = ref<IFormDescricao>(AuxiliaryModel.createDescriptionForm())

function selectBrand(brand: IAdmCadastroAuxiliar | null) {
  selectedBrand.value = brand
  formData.value = brand ? { an_descr: brand.an_descr } : AuxiliaryModel.createDescriptionForm()
  formErrors.value = {}
  formKey.value++
}

async function onSubmit(values: IFormDescricao) {
  const errors: TGenericData = {}
  const description = values.an_descr.trim()
  if (!description) errors.an_descr = 'Campo obrigatório.'
  formErrors.value = errors
  if (Object.keys(errors).length) return

  setLoading(true)
  try {
    const saved = await catalogStore.saveCadastroAuxiliar({
      cn_cadastro: selectedBrand.value?.cn_cadastro,
      ca_tipo: 'MARCA',
      an_descr: description,
      ca_sigla: '',
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

    selectBrand(null)
    loadingGrid.value = true
    try {
      await catalogStore.loadCadastros()
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
    header="Marcas"
    modal
    :style="{ width: '42rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <div v-if="canWrite('CADASTROS')" class="flex justify-end mb-3">
      <Button label="Nova marca" icon="pi pi-plus" @click="selectBrand(null)" />
    </div>
    <DataTable
      :value="records"
      :loading="loadingGrid"
      size="small"
      scrollable
      scrollHeight="14rem"
      class="mb-4"
    >
      <Column v-if="canWrite('CADASTROS')" header="Ações">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            aria-label="Editar marca"
            @click="selectBrand(data)"
          />
        </template>
      </Column>
      <Column field="an_descr" header="Descrição" />
      <template #empty>Nenhuma marca disponível.</template>
    </DataTable>
    <p v-if="canWrite('CADASTROS')" class="font-semibold mb-3">
      {{ selectedBrand ? 'Editar marca' : 'Nova marca' }}
    </p>
    <FormPage
      v-if="canWrite('CADASTROS')"
      ref="formRef"
      :key="formKey"
      novalidate
      class="flex flex-col gap-4"
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit(formData)"
    >
      <Fieldset legend="Dados da marca">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="m-[4px] col-span-12" name="an_descr" v-slot="{ invalid, field }">
            <FloatLabel variant="on">
              <InputText
                id="MarcaDialog-an_descr"
                maxlength="4000"
                v-model="formData.an_descr"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label for="MarcaDialog-an_descr">Descrição *</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </Fieldset>
    </FormPage>
    <template v-if="canWrite('CADASTROS')" #footer>
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
