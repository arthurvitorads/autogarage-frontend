<script setup lang="ts">
import { AuxiliaryModel } from '@/models/auxiliary.model'
import type { IDialogProps } from '@/interface/dialog'
import type { IFormPageRef, TGenericData } from '@/interface/util'
import type {
  IAdmCadastroAuxiliar,
  IFormDescription,
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
  saved: [category: IAdmCadastroAuxiliar]
}>()

const catalogStore = useCatalogStore()
const { cadastrosAuxiliares } = storeToRefs(catalogStore)
const records = computed(() =>
  cadastrosAuxiliares.value.filter((record) => record.ca_tipo === 'CATEGORIA_SERVICO'),
)
const selectedCategory = ref<IAdmCadastroAuxiliar | null>(null)
const loadingGrid = ref(false)
const utilStore = useUtilStore()
const { loading } = storeToRefs(utilStore)
const { normalizeError, setLoading } = utilStore
const toast = useAppToast()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
const formData = ref<IFormDescription>(AuxiliaryModel.createDescriptionForm())

function selectCategory(category: IAdmCadastroAuxiliar | null) {
  selectedCategory.value = category
  formData.value = category
    ? { an_descr: category.an_descr }
    : AuxiliaryModel.createDescriptionForm()
  formErrors.value = {}
  formKey.value++
}

async function onSubmit(values: IFormDescription) {
  const errors: TGenericData = {}
  const description = values.an_descr.trim()
  if (!description) errors.an_descr = 'Campo obrigatório.'
  formErrors.value = errors
  if (Object.keys(errors).length) return

  setLoading(true)
  try {
    const saved = await catalogStore.saveCadastroAuxiliar({
      cn_cadastro: selectedCategory.value?.cn_cadastro,
      ca_tipo: 'CATEGORIA_SERVICO',
      an_descr: description,
      ca_sigla: '',
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

    selectCategory(null)
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
    header="Categorias de serviços"
    modal
    :style="{ width: '42rem', maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <div class="flex justify-end mb-3">
      <Button label="Nova categoria" icon="pi pi-plus" @click="selectCategory(null)" />
    </div>
    <DataTable
      :value="records"
      :loading="loadingGrid"
      size="small"
      scrollable
      scrollHeight="14rem"
      class="mb-4"
    >
      <Column header="Ações">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            aria-label="Editar categoria"
            @click="selectCategory(data)"
          />
        </template>
      </Column>
      <Column field="an_descr" header="Descrição" />
      <template #empty>Nenhuma categoria de serviço disponível.</template>
    </DataTable>
    <p class="font-semibold mb-3">{{ selectedCategory ? 'Editar categoria' : 'Nova categoria' }}</p>
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      class="flex flex-col gap-4"
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit(formData)"
    >
      <Fieldset legend="Dados da categoria">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            class="col-span-12"
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
</template>
