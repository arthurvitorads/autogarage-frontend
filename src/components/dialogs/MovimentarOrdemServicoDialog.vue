<script setup lang="ts">
import type { IMoveServiceOrderDialogProps } from '@/interface/pages/OrdemServicoPage'
import type { IAdmOrdemServico } from '@/interface/tables'
import FloatLabel from 'primevue/floatlabel'
import { computed, reactive, ref, watch } from 'vue'
import type { IFormPageRef, TGenericData } from '@/interface/util'
import type { TFormFields } from '@/services/form-validation.service'
import FieldForm from '@/components/field/FieldForm.vue'
import FormPage from '@/components/pages/FormPage.vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import type { TServiceOrderAction } from '@/interface/pages/OrdemServicoPage'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'

const props = defineProps<IMoveServiceOrderDialogProps>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; saved: [ordem: IAdmOrdemServico] }>()
interface IMoveOrderForm {
  an_motivo_cancelamento: string
}

function formDataDefault(): IMoveOrderForm {
  return { an_motivo_cancelamento: '' }
}

const formData = reactive<IMoveOrderForm>(formDataDefault())
const formErrors = ref<TGenericData>({})
const formRef = ref<IFormPageRef | null>(null)
const fields: TFormFields = { an_motivo_cancelamento: { required: true } }
const loading = ref(false)
const store = useServiceOrderStore()
const { showSuccess, showError } = useAppToast()
const { normalizeError } = useUtilStore()
const title = computed(() =>
  props.action === 'INICIAR'
    ? 'Iniciar serviço'
    : props.action === 'FINALIZAR'
      ? 'Finalizar O.S.'
      : 'Cancelar O.S.',
)

watch(
  () => props.visible,
  () => {
    Object.assign(formData, formDataDefault())
    formErrors.value = {}
  },
)

async function confirmAction(values: IMoveOrderForm) {
  if (!props.order || loading.value) return
  loading.value = true
  try {
    const order = await store.movimentar(
      props.order.cn_ordem,
      props.action,
      values.an_motivo_cancelamento.trim(),
    )
    emit('saved', order)
    emit('update:visible', false)
    showSuccess('Processo realizado com sucesso.')
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="title"
    modal
    :closable="!loading"
    :closeOnEscape="!loading"
    :style="{ width: '34rem', maxWidth: '95vw' }"
  >
    <p class="mb-4">Deseja realizar o processo?</p>
    <p class="text-surface-500 mb-4">O.S. #{{ order?.nu_numero }} — {{ order?.an_cliente }}</p>
    <FormPage
      ref="formRef"
      :modelValues="formData"
      :fields="action === 'CANCELAR' ? fields : undefined"
      v-model:errors="formErrors"
      @submit="confirmAction"
    >
      <FieldForm
        v-if="action === 'CANCELAR'"
        class="m-[4px]"
        name="an_motivo_cancelamento"
        v-slot="{ invalid, field }"
      >
        <FloatLabel variant="on">
          <Textarea
            id="os-motivo-cancelamento"
            v-model="formData.an_motivo_cancelamento"
            :name="field"
            maxlength="4000"
            rows="4"
            :invalid="invalid"
            :disabled="loading"
            fluid
          />
          <label for="os-motivo-cancelamento">Motivo do cancelamento</label>
        </FloatLabel>
      </FieldForm>
    </FormPage>
    <template #footer>
      <Button
        label="Não"
        severity="secondary"
        :disabled="loading"
        @click="emit('update:visible', false)"
      />
      <Button label="Sim, confirmar" :loading="loading" @click="formRef?.submit()" />
    </template>
  </Dialog>
</template>
