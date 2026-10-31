<script setup lang="ts">
import { ref } from 'vue'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import { periodos, filtroPeriodo, intervaloDatas } from '@/services/periodo.service'

const props = defineProps<{ modelValue: (Date | null)[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: (Date | null)[]] }>()
const intervalo = intervaloDatas(props.modelValue)
const mesAtual = filtroPeriodo('mes-atual')
const periodo = ref<string | null>(intervalo?.inicio === mesAtual.inicio && intervalo?.fim === mesAtual.fim ? 'mes-atual' : null)

function selecionarPeriodo(value: string) {
  const { inicio, fim } = filtroPeriodo(value)
  emit('update:modelValue', [new Date(inicio), new Date(fim)])
}

function selecionarData(value: Date | Date[] | (Date | null)[] | null | undefined) {
  periodo.value = null
  emit('update:modelValue', Array.isArray(value) ? value : [])
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <label class="flex flex-col gap-1">
      <span class="text-sm font-semibold">Data</span>
      <DatePicker :modelValue="modelValue" selectionMode="range" dateFormat="dd/mm/yy" showIcon :manualInput="false" :disabled="disabled" placeholder="Selecione as datas" @update:modelValue="selecionarData" />
    </label>
    <label class="flex flex-col gap-1">
      <span class="text-sm text-surface-500">Períodos</span>
      <Select v-model="periodo" :options="periodos" optionLabel="label" optionValue="value" placeholder="Personalizado" :disabled="disabled" @update:modelValue="selecionarPeriodo" />
    </label>
  </div>
</template>
