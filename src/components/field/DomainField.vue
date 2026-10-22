<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'

import Select from 'primevue/select'
import Message from 'primevue/message'
import Button from 'primevue/button'

import { getDomainOptions } from '@/services/domain.service'
import type { DomainOption, DomainValue, IDomainFieldProps } from '@/interface/util'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<IDomainFieldProps>(), {
  optionsPath: 'dados',
  placeholder: 'Selecione uma opção',
  emptyMessage: 'Nenhuma opção disponível',
  disabled: false,
  invalid: false,
  filter: true,
  showClear: true,
  hideWhenEmpty: false,
})

const model = defineModel<DomainValue>()

const emit = defineEmits<{
  loaded: [options: DomainOption[]]
  error: [error: Error]
}>()

const options = ref<DomainOption[]>([])
const isLoading = ref(false)
const errorMessage = ref('')

const generatedId = useId()

const fieldId = computed(() => props.inputId ?? generatedId)
const statusId = computed(() => `${fieldId.value}-status`)
const isEmpty = computed(() => !isLoading.value && !errorMessage.value && options.value.length === 0)
const fieldPlaceholder = computed(() => {
  if (isLoading.value)
    return 'Carregando opções...'

  if (errorMessage.value)
    return 'Opções indisponíveis'

  return isEmpty.value ? props.emptyMessage : props.placeholder
})

let controller: AbortController | undefined

async function reload() {
  controller?.abort()

  const current = new AbortController()
  controller = current
  options.value = []
  errorMessage.value = ''
  isLoading.value = true

  try {
    const result = await getDomainOptions(props.endpoint, props.optionsPath, props.params, current.signal)
    if (current.signal.aborted)
      return

    options.value = result
    emit('loaded', options.value)
  } catch (error) {
    if (current.signal.aborted)
      return

    const failure = error instanceof Error ? error : new Error('Não foi possível carregar as opções.')
    errorMessage.value = failure.message
    emit('error', failure)
  } finally {
    if (controller === current)
      isLoading.value = false
  }
}

watch(() => [props.endpoint, props.optionsPath, props.params], () => {
  void reload()
}, { immediate: true, deep: true })

onBeforeUnmount(() => controller?.abort())
defineExpose({ reload })
</script>

<template>
  <div class="flex min-w-0 flex-col gap-1" :class="$attrs.class" :style="$attrs.style">
    <label v-if="label" :for="fieldId">{{ label }}</label>
    <Select
      v-if="!(hideWhenEmpty && isEmpty)"
      v-bind="{ ...$attrs, class: undefined, style: undefined }"
      v-model="model"
      :name="name"
      :inputId="fieldId"
      :options="options"
      optionLabel="an_descr"
      optionValue="id"
      :placeholder="fieldPlaceholder"
      :loading="isLoading"
      :disabled="disabled || isLoading || !!errorMessage"
      :invalid="invalid"
      :filter="filter"
      :showClear="showClear"
      :emptyMessage="emptyMessage"
      emptyFilterMessage="Nenhuma opção encontrada"
      :aria-busy="isLoading"
      fluid
    />
    <div v-if="errorMessage" class="flex items-center gap-2">
      <Message :id="statusId" severity="error" size="small" variant="simple" role="alert">
        {{ errorMessage }}
      </Message>
      <Button
        type="button"
        label="Tentar novamente"
        icon="pi pi-refresh"
        text
        size="small"
        :disabled="disabled"
        @click="reload"
      />
    </div>
  </div>
</template>
