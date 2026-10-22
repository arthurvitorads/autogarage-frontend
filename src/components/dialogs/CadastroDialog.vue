<script setup lang="ts">
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

// Estrutura padrão das janelas de cadastro: conteúdo em fieldsets e rodapé fixo.
withDefaults(defineProps<{
  visible: boolean
  header: string
  width?: string
  disabled?: boolean
}>(), {
  width: '72rem',
  disabled: false,
})

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  submit: []
}>()
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="header"
    modal
    :style="{ width, maxWidth: '95vw', maxHeight: '90vh' }"
  >
    <slot />
    <template #footer>
      <div class="flex w-full justify-end gap-2 border-t border-surface-200 pt-4">
        <Button type="button" label="Cancelar" severity="secondary" @click="emit('update:visible', false)" />
        <Button type="button" label="Gravar" :disabled="disabled" @click="emit('submit')" />
      </div>
    </template>
  </Dialog>
</template>
