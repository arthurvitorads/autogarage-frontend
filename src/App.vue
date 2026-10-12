
<script setup lang="ts">
import LoaderPage from './components/pages/LoaderPage.vue'
import Toast from 'primevue/toast'
</script>
<template>
  <LoaderPage />
  <Toast position="top-right" />
  <RouterView />
</template>