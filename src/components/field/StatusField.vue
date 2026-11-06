<script setup lang="ts">
import { computed } from 'vue'
import SplitButton from 'primevue/splitbutton'

const props = defineProps<{
  disabled?: boolean
}>()

const model = defineModel<boolean>({ required: true })
const opcoes = computed(() => [
  {
    label: 'Ativo',
    icon: 'pi pi-check-circle',
    disabled: props.disabled || model.value,
    command: () => alterarStatus(true),
  },
  {
    label: 'Inativo',
    icon: 'pi pi-times-circle',
    disabled: props.disabled || !model.value,
    command: () => alterarStatus(false),
  },
])

function alterarStatus(ativo: boolean) {
  if (!props.disabled) model.value = ativo
}
</script>

<template>
  <SplitButton
    :label="model ? 'Ativo' : 'Inativo'"
    :icon="model ? 'pi pi-check-circle' : 'pi pi-times-circle'"
    :severity="model ? 'success' : 'danger'"
    :model="opcoes"
    :disabled="disabled"
    :buttonProps="{
      type: 'button',
      'aria-label': model ? 'Status ativo: desativar' : 'Status inativo: ativar',
    }"
    :menuButtonProps="{ type: 'button', 'aria-label': 'Selecionar status ativo ou inativo' }"
    class="whitespace-nowrap"
    @click="alterarStatus(!model)"
  />
</template>
