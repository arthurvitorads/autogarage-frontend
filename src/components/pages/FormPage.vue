<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, provide, ref } from 'vue'
import { Form, type FormSubmitEvent } from '@primevue/forms'

import type { TGenericData } from '@/interface/util'

import { FORM_ERRORS_KEY } from '@/constants/FormContext'


const props = withDefaults(
	defineProps<{
		initialValues?: T
		errors?: TGenericData
		toastErros?: boolean
	}>(),
	{
		initialValues: () => ({}) as T,
		errors: () => ({}),
		toastErros: true,
	},
)

provide(FORM_ERRORS_KEY, computed(() => props.errors))

const emit = defineEmits<{
	submit: [values: T]
	'update:errors': [errors: TGenericData]
}>()

const formRef = ref()

function cleanError(event: Event) {
	const nome = (event.target as HTMLInputElement | null)?.name
	if (!nome || !props.errors[nome]) return

	const { [nome]: _removido, ...restante } = props.errors
	emit('update:errors', restante)
}

function onSubmit({ values }: FormSubmitEvent) {
	emit('submit', values as T)
}

defineExpose({ submit: () => formRef.value?.submit() })
</script>

<template>
	<Form ref="formRef" :initialValues="initialValues" @submit="onSubmit" @input="cleanError">
		<slot :errors="errors" />
	</Form>
</template>