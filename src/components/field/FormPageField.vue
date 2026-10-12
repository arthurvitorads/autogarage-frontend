<script setup lang="ts">
import { computed, inject } from 'vue'
import Message from 'primevue/message'
import { FORM_ERRORS_KEY } from '@/constants/FormContext'

const props = defineProps<{
  name: string
  label?: string
}>()

const errors = inject(FORM_ERRORS_KEY)
const error = computed(() => errors?.value[props.name] as string | undefined)
const invalid = computed(() => !!error.value)
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label">{{ label }}</label>

    <slot :invalid="invalid" :field="name" />
    
    <div class="min-h-5">
      <Message v-if="error" severity="error" size="small" variant="simple">
        {{ error }}
      </Message>
    </div>
  </div>
</template>