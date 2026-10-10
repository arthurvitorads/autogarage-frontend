
<script setup lang="ts">
import LoaderComponent from './components/default/LoaderComponent.vue'
import Toast from 'primevue/toast'
</script>
<template>
  <LoaderComponent />
  <Toast position="top-right" />
  <RouterView />
</template>