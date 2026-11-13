<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import { updateItemTime } from '@/services/ordem-api.service'
import { formatTempo } from '@/services/tempo.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import type { TItemOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'

const props = defineProps<{ item: TItemOrdemServico; editable?: boolean }>()
const emit = defineEmits<{ saved: [item: TItemOrdemServico] }>()
const { showError } = useAppToast()
const { normalizeError } = useUtilStore()
const agora = ref(0)
const origem = ref(0)
const servidor = ref(0)
const saving = ref(false)
let relogio: ReturnType<typeof setInterval> | undefined
watch(
  () => props.item.dt_servidor,
  () => {
    const item = props.item
    origem.value = performance.now()
    servidor.value = new Date(item.dt_servidor).getTime()
    agora.value = servidor.value
  },
  { immediate: true },
)
const segundos = computed(
  () =>
    props.item.qt_tempo_segundos +
    (props.item.dt_inicio_tempo
      ? Math.max(
          0,
          Math.floor((agora.value - new Date(props.item.dt_inicio_tempo).getTime()) / 1000),
        )
      : 0),
)
const nomes = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  PAUSADO: 'Pausado',
  FINALIZADO: 'Concluído',
  CANCELADO: 'Cancelado',
}
onMounted(() => {
  relogio = setInterval(() => {
    agora.value = servidor.value + performance.now() - origem.value
  }, 1000)
})
onUnmounted(() => {
  if (relogio) clearInterval(relogio)
})

async function movimentar(acao: 'INICIAR' | 'PAUSAR' | 'FINALIZAR') {
  if (saving.value) return
  saving.value = true
  try {
    const { cn_ordem_servico, cn_item } = props.item
    const { dados } = await updateItemTime(cn_ordem_servico, cn_item, acao)
    emit('saved', dados)
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="item.ca_tipo === 'SERVICO'" class="flex flex-col gap-1 min-w-44">
    <span class="font-mono font-semibold">{{ formatTempo(segundos) }}</span>
    <small class="text-surface-500">{{ nomes[item.ca_status_servico] }}</small>
    <div v-if="editable" class="flex gap-1">
      <Button
        v-if="['PENDENTE', 'PAUSADO'].includes(item.ca_status_servico)"
        icon="pi pi-play"
        text
        size="small"
        :aria-label="item.ca_status_servico === 'PAUSADO' ? 'Retomar serviço' : 'Iniciar serviço'"
        :disabled="saving"
        @click="movimentar('INICIAR')"
      />
      <Button
        v-if="item.ca_status_servico === 'EM_ANDAMENTO'"
        icon="pi pi-pause"
        text
        size="small"
        aria-label="Pausar serviço"
        :disabled="saving"
        @click="movimentar('PAUSAR')"
      />
      <Button
        v-if="['EM_ANDAMENTO', 'PAUSADO'].includes(item.ca_status_servico)"
        icon="pi pi-check"
        text
        size="small"
        aria-label="Concluir serviço"
        :disabled="saving"
        @click="movimentar('FINALIZAR')"
      />
    </div>
  </div>
</template>
