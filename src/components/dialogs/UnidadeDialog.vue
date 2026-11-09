<script setup lang="ts">
import { AuxiliaryModel } from '@/models/auxiliary.model'
import type { IDialogProps } from '@/interface/dialog'
import type { IFormPageRef, TGenericData } from '@/interface/util'
import type {
  IAdmCadastroAuxiliar,
  IFormAuxiliary,
} from '@/interface/interface-pages/CadastroAuxiliar'
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
  saved: [unit: IAdmCadastroAuxiliar]
}>()

const catalogStore = useCatalogStore()
const { cadastrosAuxiliares } = storeToRefs(catalogStore)
const records = computed(() =>
  cadastrosAuxiliares.value.filter((record) => record.ca_tipo === 'UNIDADE'),
)
const selectedUnit = ref<IAdmCadastroAuxiliar | null>(null)
const loadingGrid = ref(false)
const utilStore = useUtilStore()
const { loading } = storeToRefs(utilStore)
const { normalizeError, setLoading, canWrite } = utilStore
const toast = useAppToast()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
const formData = ref<IFormAuxiliary>(AuxiliaryModel.createForm())

function selectUnit(unit: IAdmCadastroAuxiliar | null) {
  selectedUnit.value = unit
  formData.value = unit
    ? { an_descr: unit.an_descr, ca_sigla: unit.ca_sigla }
    : AuxiliaryModel.createForm()
  formErrors.value = {}
  formKey.value++
}

async function onSubmit(values: IFormAuxiliary) {
  const errors: TGenericData = {}
  const description = values.an_descr.trim()
  const abbreviation = values.ca_sigla.trim().toUpperCase()
  if (!description) errors.an_descr = 'Campo obrigatório.'
  if (!/^[A-Z0-9]{1,10}$/.test(abbreviation))
    errors.ca_sigla = 'Informe uma sigla com até 10 letras ou números.'
  formErrors.value = errors
  if (Object.keys(errors).length) return

  setLoading(true)
  try {
    const saved = await catalogStore.saveCadastroAuxiliar({
      cn_cadastro: selectedUnit.value?.cn_cadastro,
      ca_tipo: 'UNIDADE',
      an_descr: description,
      ca_sigla: abbreviation,
    })
    emit('saved', saved)
    toast.success('Processo realizado com sucesso.')
    emit('update:visible', false)
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return

    selectUnit(null)
    loadingGrid.value = true
    try {
      await catalogStore.loadCadastros()
    } catch (error) {
      toast.error(normalizeError(error))
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
    <div v-if="canWrite('CADASTROS')" class="flex justify-end mb-3">
      <Button label="Nova unidade" icon="pi pi-plus" @click="selectUnit(null)" />
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
            aria-label="Editar unidade"
            @click="selectUnit(data)"
          />
        </template>
      </Column>
      <Column field="an_descr" header="Descrição" />
      <Column field="ca_sigla" header="Sigla" />
      <template #empty>Nenhuma unidade disponível.</template>
    </DataTable>
    <p v-if="canWrite('CADASTROS')" class="font-semibold mb-3">
      {{ selectedUnit ? 'Editar unidade' : 'Nova unidade' }}
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
      <Fieldset legend="Dados da unidade">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="col-span-12 sm:col-span-8"
            name="an_descr"
            label="Descrição *"
            v-slot="{ invalid, field }"
          >
            <InputText
              maxlength="4000"
              v-model="formData.an_descr"
              :name="field"
              :invalid="invalid"
              fluid
            />
          </FieldForm>
          <FieldForm
            class="col-span-12 sm:col-span-4"
            name="ca_sigla"
            label="Sigla *"
            v-slot="{ invalid, field }"
          >
            <InputText
              v-model="formData.ca_sigla"
              :name="field"
              :invalid="invalid"
              maxlength="10"
              fluid
            />
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
