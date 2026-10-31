<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import type { IAdmOrdemServico, TAcaoOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'

const props = defineProps<{ visible: boolean; ordem: IAdmOrdemServico | null; acao: TAcaoOrdemServico }>()
const emit = defineEmits<{ 'update:visible': [value: boolean]; saved: [ordem: IAdmOrdemServico] }>()
const motivo = ref('')
const erro = ref('')
const loading = ref(false)
const store = useOrdemServicoStore()
const toast = useAppToast()
const { normalizeError } = useUtilStore()
const titulo = computed(() => props.acao === 'INICIAR' ? 'Iniciar serviço' : props.acao === 'FINALIZAR' ? 'Finalizar O.S.' : 'Cancelar O.S.')

watch(() => props.visible, () => {
  motivo.value = ''
  erro.value = ''
})

async function confirmar() {
  if (!props.ordem || loading.value)
    return
  if (props.acao === 'CANCELAR' && !motivo.value.trim()) {
    erro.value = 'Informe o motivo do cancelamento.'
    return
  }
  loading.value = true
  try {
    const ordem = await store.movimentar(props.ordem.cn_ordem_servico, props.acao, motivo.value.trim())
    emit('saved', ordem)
    emit('update:visible', false)
    toast.success('Processo realizado com sucesso.')
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog :visible="visible" @update:visible="emit('update:visible', $event)" :header="titulo" modal :closable="!loading" :closeOnEscape="!loading" :style="{ width: '34rem', maxWidth: '95vw' }">
    <p class="mb-4">Deseja realizar o processo?</p>
    <p class="text-surface-500 mb-4">O.S. #{{ ordem?.nu_numero }} — {{ ordem?.an_cliente }}</p>
    <label v-if="acao === 'CANCELAR'" class="flex flex-col gap-2">
      <span>Motivo do cancelamento *</span>
      <Textarea v-model="motivo" maxlength="4000" rows="4" :invalid="!!erro" :disabled="loading" fluid />
      <span v-if="erro" class="text-red-600 text-sm">{{ erro }}</span>
    </label>
    <template #footer>
      <Button label="Não" severity="secondary" :disabled="loading" @click="emit('update:visible', false)" />
      <Button label="Sim, confirmar" :loading="loading" @click="confirmar" />
    </template>
  </Dialog>
</template>
