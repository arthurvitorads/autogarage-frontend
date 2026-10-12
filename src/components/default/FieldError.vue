<script setup lang="ts">
defineProps<{ message?: string }>()
</script>

<template>
  <div class="min-h-5">
    <Message v-if="message" severity="error" size="small" variant="simple">
      {{ message }}
    </Message>
  </div>
</template>