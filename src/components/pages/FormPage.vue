<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, provide, ref, watch } from 'vue'
import { Form, type FormInstance, type FormSubmitEvent } from '@primevue/forms'

import type { TGenericData } from '@/interface/util'

import { FORM_ERRORS_KEY, FORM_REQUIRED_KEY } from '@/constants/FormContext'
import {
  isRequiredField,
  validateFormFields,
  type TFormFields,
} from '@/services/form-validation.service'

const props = withDefaults(
  defineProps<{
    initialValues?: T
    modelValues?: T
    errors?: TGenericData
    fields?: TFormFields
    validate?: (values: T) => TGenericData
    toastErros?: boolean
    revalidateErrors?: boolean
  }>(),
  {
    initialValues: () => ({}) as T,
    errors: () => ({}),
    toastErros: true,
  },
)

provide(
  FORM_ERRORS_KEY,
  computed(() => props.errors),
)
const emit = defineEmits<{
  submit: [values: T]
  'update:errors': [errors: TGenericData]
}>()

const formRef = ref<FormInstance<T>>()
const displayedValues = computed(
  () =>
    props.modelValues ?? {
      ...props.initialValues,
      ...Object.fromEntries(
        Object.entries(formRef.value?.states ?? {}).map(([name, state]) => [name, state.value]),
      ),
    },
)

provide(FORM_REQUIRED_KEY, (name) => isRequiredField(props.fields?.[name], displayedValues.value))

function cleanError(event: Event) {
  if (props.revalidateErrors && props.modelValues) return
  const nome = (event.target as HTMLInputElement | null)?.name
  if (!nome || !props.errors[nome]) return

  const { [nome]: _removido, ...restante } = props.errors
  emit('update:errors', restante)
}

function validateValues(values: T) {
  return {
    ...props.validate?.(values),
    ...validateFormFields(props.fields ?? {}, values),
  }
}

watch(
  () => props.modelValues,
  (values) => {
    if (!props.revalidateErrors || !values) return
    const fields = Object.keys(props.errors)
    if (!fields.length) return

    const validated = validateValues(values)
    const errors = Object.fromEntries(
      fields.filter((field) => validated[field]).map((field) => [field, validated[field]]),
    )
    if (fields.some((field) => props.errors[field] !== errors[field])) emit('update:errors', errors)
  },
  { deep: true },
)

function onSubmit({ values }: FormSubmitEvent) {
  const currentValues = props.modelValues ? { ...props.modelValues } : (values as T)
  if (props.fields || props.validate) {
    const errors = validateValues(currentValues)
    emit('update:errors', errors)
    if (Object.keys(errors).length > 0) return
  }

  emit('submit', currentValues)
}

defineExpose({ submit: () => formRef.value?.submit() })
</script>

<template>
  <Form ref="formRef" :initialValues="initialValues" @submit="onSubmit" @input="cleanError">
    <slot :errors="errors" />
  </Form>
</template>
