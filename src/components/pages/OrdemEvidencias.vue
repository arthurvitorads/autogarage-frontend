<script setup lang="ts">
import Image from 'primevue/image'
import Button from 'primevue/button'
import type { IServiceOrderEvidenceInput } from '@/interface/pages/OrdemServicoPage'

defineProps<{ images: readonly IServiceOrderEvidenceInput[]; removable?: boolean }>()
const emit = defineEmits<{ remove: [index: number] }>()
</script>

<template>
  <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
    <li
      v-for="(image, index) in images"
      :key="index"
      class="min-w-0 rounded border border-surface-200 p-2"
    >
      <Image
        :src="`data:${image.ca_mime};base64,${image.bl_imagem}`"
        :alt="image.an_nome"
        imageClass="h-24 w-full object-cover"
        preview
      />
      <div class="mt-1 flex items-center justify-between gap-1">
        <span class="truncate text-sm" :title="image.an_nome">{{ image.an_nome }}</span>
        <Button
          v-if="removable"
          type="button"
          icon="pi pi-trash"
          text
          severity="danger"
          :aria-label="`Remover ${image.an_nome}`"
          @click="emit('remove', index)"
        />
      </div>
    </li>
  </ul>
</template>
