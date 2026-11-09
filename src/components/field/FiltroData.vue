<script setup lang="ts">
import DatePicker from 'primevue/datepicker'

defineProps<{ modelValue: (Date | null)[]; disabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: (Date | null)[]] }>()

function selectDates(value: Date | (Date | null)[] | null | undefined) {
  emit('update:modelValue', Array.isArray(value) ? value : [])
}
</script>

<template>
  <div class="flex flex-wrap items-end gap-3">
    <label class="flex flex-col gap-1">
      <span class="text-sm font-semibold">Data</span>
      <DatePicker
        :modelValue="modelValue"
        selectionMode="range"
        dateFormat="dd/mm/yy"
        showIcon
        :manualInput="false"
        :disabled="disabled"
        placeholder="Selecione as datas"
        @update:modelValue="selectDates"
      />
    </label>
  </div>
</template>
