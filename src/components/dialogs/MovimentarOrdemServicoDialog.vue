<script setup lang="ts">
import FloatLabel from 'primevue/floatlabel'
import type { IMoveServiceOrderDialogProps } from '@/interface/dialog'
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import type {
  IAdmOrdemServico,
  TServiceOrderAction,
} from '@/interface/interface-pages/OrdemServicoPage'
import { useOrdemServicoStore as useServiceOrderStore } from '@/stores/ordem-servico.store'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'

const props = defineProps<IMoveServiceOrderDialogProps>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; saved: [ordem: IAdmOrdemServico] }>()
const reason = ref('')
const errorMessage = ref('')
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
    reason.value = ''
    errorMessage.value = ''
  },
)

async function confirmAction() {
  if (!props.order || loading.value) return
  if (props.action === 'CANCELAR' && !reason.value.trim()) {
    errorMessage.value = 'Informe o motivo do cancelamento.'
    return
  }
  loading.value = true
  try {
    const order = await store.movimentar(
      props.order.cn_ordem_servico,
      props.action,
      reason.value.trim(),
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
    <div v-if="action === 'CANCELAR'" class="m-[4px] flex flex-col gap-2">
      <FloatLabel variant="on">
        <Textarea
          id="os-motivo-cancelamento"
          v-model="reason"
          maxlength="4000"
          rows="4"
          :invalid="!!errorMessage"
          :disabled="loading"
          fluid
        />
        <label for="os-motivo-cancelamento">Motivo do cancelamento *</label>
      </FloatLabel>
      <span v-if="errorMessage" class="text-red-600 text-sm">{{ errorMessage }}</span>
    </div>
    <template #footer>
      <Button
        label="Não"
        severity="secondary"
        :disabled="loading"
        @click="emit('update:visible', false)"
      />
      <Button label="Sim, confirmar" :loading="loading" @click="confirmAction" />
    </template>
  </Dialog>
</template>
