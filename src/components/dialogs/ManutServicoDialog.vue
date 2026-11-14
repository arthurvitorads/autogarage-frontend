<script setup lang="ts">
import type { IManutServicoDialogProps } from '@/interface/pages/ServicoPage'
import type { IAdmCadastroAuxiliar } from '@/interface/tables'
import FloatLabel from 'primevue/floatlabel'
import { ServiceModel } from '@/models/service.model'
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
import CategoriaServicoDialog from '@/components/dialogs/CategoriaServicoDialog.vue'

import type { IFormServico, IManutServico } from '@/interface/pages/ServicoPage'
import type { TGenericData } from '@/interface/util'

import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { useCatalogoStore as useCatalogStore } from '@/stores/catalogo.store'

const props = defineProps<IManutServicoDialogProps>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [servico: IManutServico]
}>()

const { showSuccess, showError } = useAppToast()
const catalogStore = useCatalogStore()
const { saveServico: saveService } = catalogStore
const { categoriasServico: serviceCategories } = storeToRefs(catalogStore)
const categoryDialogVisible = ref(false)

function selectCategory(auxiliary: IAdmCadastroAuxiliar) {
  formData.value.an_categoria = auxiliary.an_descr
  delete formErrors.value.an_categoria
}

const { normalizeError, setLoading } = useUtilStore()
const { loading } = storeToRefs(useUtilStore())

const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<IFormPageRef | null>(null)
const isValidated = ref(false)
const isEditing = computed(() => !!props.service)

const formData = ref<IFormServico>(ServiceModel.createForm())

async function onSubmit(values: IFormServico) {
  const errors: TGenericData = {}

  if (!values.an_nome.trim()) errors.an_nome = 'Campo obrigatório.'

  if (values.an_categoria && !serviceCategories.value.includes(values.an_categoria))
    errors.an_categoria = 'Selecione uma categoria.'

  if (
    values.vl_preco === null ||
    !Number.isFinite(values.vl_preco) ||
    values.vl_preco < 0 ||
    values.vl_preco > 999_999_999.99 ||
    Math.abs(values.vl_preco * 100 - Math.round(values.vl_preco * 100)) > 0.000001
  )
    errors.vl_preco = 'Informe um preço válido, com até duas casas decimais.'

  if (
    values.nu_tempo_estimado !== null &&
    (!Number.isSafeInteger(values.nu_tempo_estimado) ||
      values.nu_tempo_estimado < 1 ||
      values.nu_tempo_estimado > 999999)
  )
    errors.nu_tempo_estimado = 'Informe o tempo em minutos inteiros, maior que zero.'

  formErrors.value = errors
  isValidated.value = !Object.keys(errors).length

  if (!isValidated.value) return

  setLoading(true)

  try {
    const service: IManutServico = {
      ...(props.service ? { cn_servico: props.service.cn_servico } : {}),
      an_nome: values.an_nome.trim(),
      an_categoria: values.an_categoria ?? '',
      vl_preco: values.vl_preco ?? 0,
      ...(values.nu_tempo_estimado !== null ? { nu_tempo_estimado: values.nu_tempo_estimado } : {}),
      an_obs: values.an_obs.trim(),
      bo_sts_reg: values.bo_sts_reg,
    }

    await saveService(service)
    emit('saved', service)
    showSuccess('Processo realizado com sucesso.')
    emit('update:visible', false)
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch(
  [() => props.visible, () => props.service],
  ([visible]) => {
    if (!visible) return

    const service = props.service

    formData.value = service
      ? {
          an_nome: service.an_nome,
          an_categoria: service.an_categoria,
          vl_preco: service.vl_preco,
          nu_tempo_estimado: service.nu_tempo_estimado ?? null,
          an_obs: service.an_obs,
          bo_sts_reg: service.bo_sts_reg,
        }
      : ServiceModel.createForm()
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
    :header="isEditing ? 'Editar serviço' : 'Novo serviço'"
    modal
    :style="{ width: '72rem', maxWidth: '95vw', maxHeight: '90vh' }"
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
                id="ManutServicoDialog-an_nome"
                maxlength="4000"
                v-model="formData.an_nome"
                :name="field"
                :invalid="invalid"
                fluid
              />
              <label for="ManutServicoDialog-an_nome">Nome *</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm class="m-[4px] col-span-12 sm:col-span-2" name="bo_sts_reg">
            <StatusField v-model="formData.bo_sts_reg" />
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="an_categoria"
            v-slot="{ invalid, field }"
          >
            <div class="flex gap-2">
              <FloatLabel variant="on" class="flex-1 min-w-0">
                <Select
                  inputId="ManutServicoDialog-an_categoria"
                  v-model="formData.an_categoria"
                  :name="field"
                  :options="serviceCategories"
                  :invalid="invalid"
                  showClear
                  fluid
                />
                <label for="ManutServicoDialog-an_categoria">Categoria</label>
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
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="vl_preco"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputNumber
                inputId="ManutServicoDialog-vl_preco"
                v-model="formData.vl_preco"
                :name="field"
                :invalid="invalid"
                fluid
                locale="pt-BR"
                mode="currency"
                currency="BRL"
                :max="999999999.99"
                :min="0"
              />
              <label for="ManutServicoDialog-vl_preco">Preço do serviço *</label>
            </FloatLabel>
          </FieldForm>
          <FieldForm
            class="m-[4px] col-span-12 sm:col-span-6 lg:col-span-4"
            name="nu_tempo_estimado"
            v-slot="{ invalid, field }"
          >
            <FloatLabel variant="on">
              <InputNumber
                inputId="ManutServicoDialog-nu_tempo_estimado"
                v-model="formData.nu_tempo_estimado"
                :name="field"
                :invalid="invalid"
                fluid
                locale="pt-BR"
                :max="999999"
                :min="0"
                :maxFractionDigits="0"
              />
              <label for="ManutServicoDialog-nu_tempo_estimado">Tempo estimado (minutos)</label>
            </FloatLabel>
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset legend="Observações">
        <FieldForm class="m-[4px]" name="an_obs" v-slot="{ field }">
          <Textarea maxlength="4000" v-model="formData.an_obs" :name="field" rows="2" fluid />
        </FieldForm>
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
  <CategoriaServicoDialog v-model:visible="categoryDialogVisible" @saved="selectCategory" />
</template>
