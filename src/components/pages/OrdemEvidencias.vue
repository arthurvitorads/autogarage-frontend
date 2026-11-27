<script setup lang="ts">
import Image from 'primevue/image'
import Button from 'primevue/button'
import type { IServiceOrderEvidenceInput } from '@/interface/pages/OrdemServicoPage'

defineProps<{
  images: readonly IServiceOrderEvidenceInput[]
  removableFrom?: number
  compact?: boolean
}>()
const emit = defineEmits<{
  remove: [index: number]
  edit: [index: number]
}>()
</script>

<template>
  <ul
    :class="
      compact
        ? 'flex min-w-0 items-center gap-2'
        : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'
    "
  >
    <li
      v-for="(image, index) in images"
      :key="index"
      class="min-w-0"
      :class="compact ? 'w-44' : 'rounded border border-surface-200 p-2'"
    >
      <Image
        :src="`data:${image.ca_mime};base64,${image.bl_imagem}`"
        :alt="image.an_nome"
        :class="{ 'block w-full rounded border border-surface-200': compact }"
        :imageClass="compact ? 'h-20 w-full object-contain' : 'h-24 w-full object-cover'"
        preview
      />
      <div class="mt-1 flex items-center justify-between gap-1">
        <span class="truncate text-sm" :class="{ 'font-medium': compact }" :title="image.an_nome">
          {{ image.an_nome }}
        </span>
        <Button
          v-if="compact"
          type="button"
          icon="pi pi-pencil"
          size="small"
          text
          severity="secondary"
          class="w-4! shrink-0 p-0!"
          :aria-label="'Editar descrição de ' + image.an_nome"
          @click="emit('edit', index)"
        />
        <Button
          v-if="removableFrom !== undefined && index >= removableFrom"
          type="button"
          icon="pi pi-trash"
          size="small"
          text
          severity="danger"
          class="w-4! shrink-0 p-0!"
          :aria-label="`Remover ${image.an_nome}`"
          @click="emit('remove', index)"
        />
      </div>
      <p v-if="compact" class="truncate text-sm text-surface-600" :title="image.an_descr">
        {{ image.an_descr || 'Sem descrição' }}
      </p>
      <p v-else-if="image.an_descr" class="mt-1 whitespace-pre-wrap break-words text-sm">
        {{ image.an_descr }}
      </p>
    </li>
    <slot />
  </ul>
</template>
