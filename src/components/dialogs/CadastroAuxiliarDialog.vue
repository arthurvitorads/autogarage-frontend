<script setup lang="ts">
import { AuxiliaryModel } from '@/models/auxiliary.model'
import type { IFormPageRef } from '@/interface/util'
import type { IAuxiliaryDialogProps } from '@/interface/dialog'
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'

import CadastroDialog from '@/components/dialogs/CadastroDialog.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'

import type {
  IAdmCadastroAuxiliar,
  IFormAuxiliary,
  TAuxiliaryType,
} from '@/interface/interface-pages/CadastroAuxiliar'
import type { TGenericData } from '@/interface/util'

import { useCatalogoStore as useCatalogStore } from '@/stores/catalogo.store'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'

const props = defineProps<IAuxiliaryDialogProps>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [cadastro: IAdmCadastroAuxiliar]
}>()

const catalogStore = useCatalogStore()
const { saveCadastroAuxiliar: saveAuxiliary } = catalogStore
const { cadastrosAuxiliares } = storeToRefs(catalogStore)
const records = computed(() =>
  cadastrosAuxiliares.value.filter((item) => item.ca_tipo === props.auxiliaryType),
)
const selectedAuxiliary = ref<IAdmCadastroAuxiliar | null>(null)
const loadingGrid = ref(false)
const { normalizeError, setLoading } = useUtilStore()
const toast = useAppToast()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
const header = computed(() =>
  props.auxiliaryType === 'MARCA'
    ? 'Marcas'
    : props.auxiliaryType === 'UNIDADE'
      ? 'Unidades'
      : props.auxiliaryType === 'CATEGORIA_PRODUTO'
        ? 'Categorias de produtos'
        : 'Categorias de serviços',
)

function editAuxiliary(auxiliary: IAdmCadastroAuxiliar | null) {
  selectedAuxiliary.value = auxiliary
  formData.value = auxiliary
    ? { an_descr: auxiliary.an_descr, ca_sigla: auxiliary.ca_sigla }
    : AuxiliaryModel.createForm()
  formErrors.value = {}
  formKey.value++
}

const formData = ref<IFormAuxiliary>(AuxiliaryModel.createForm())

async function onSubmit(values: IFormAuxiliary) {
  const errors: TGenericData = {}

  if (!values.an_descr.trim()) errors.an_descr = 'Campo obrigatório.'

  if (
    props.auxiliaryType === 'UNIDADE' &&
    !/^[A-Z0-9]{1,10}$/.test(values.ca_sigla.trim().toUpperCase())
  )
    errors.ca_sigla = 'Informe uma sigla com até 10 letras ou números.'

  formErrors.value = errors

  if (Object.keys(errors).length) return

  setLoading(true)

  try {
    const data = {
      ...(selectedAuxiliary.value ? { cn_cadastro: selectedAuxiliary.value.cn_cadastro } : {}),
      ca_tipo: props.auxiliaryType,
      an_descr: values.an_descr.trim(),
      ca_sigla: props.auxiliaryType === 'UNIDADE' ? values.ca_sigla.trim().toUpperCase() : '',
    }
    const auxiliary = await saveAuxiliary(data)
    emit('saved', auxiliary)
    toast.success('Processo realizado com sucesso.')
    emit('update:visible', false)
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(
  [() => props.visible, () => props.auxiliaryType],
  async ([visible]) => {
    if (!visible) return

    editAuxiliary(null)
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
  <CadastroDialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="header"
    width="42rem"
    @submit="formRef?.submit()"
  >
    <div class="flex justify-end mb-3">
      <Button label="Novo" icon="pi pi-plus" @click="editAuxiliary(null)" />
    </div>
    <DataTable
      :value="records"
      :loading="loadingGrid"
      size="small"
      scrollable
      scrollHeight="14rem"
      class="mb-4"
    >
      <Column header="Ações"
        ><template #body="{ data }"
          ><Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            aria-label="Editar cadastro"
            @click="editAuxiliary(data)" /></template
      ></Column>
      <Column field="an_descr" header="Descrição" />
      <Column v-if="auxiliaryType === 'UNIDADE'" field="ca_sigla" header="Sigla" />
      <template #empty>Nenhum cadastro disponível.</template>
    </DataTable>
    <p class="font-semibold mb-3">{{ selectedAuxiliary ? 'Editar cadastro' : 'Novo cadastro' }}</p>
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      class="flex flex-col gap-4"
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit(formData)"
    >
      <Fieldset
        :legend="
          auxiliaryType === 'UNIDADE'
            ? 'Dados da unidade'
            : auxiliaryType === 'MARCA'
              ? 'Dados da marca'
              : 'Dados da categoria'
        "
      >
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm
            :class="auxiliaryType === 'UNIDADE' ? 'col-span-12 sm:col-span-8' : 'col-span-12'"
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
            v-if="auxiliaryType === 'UNIDADE'"
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
  </CadastroDialog>
</template>
