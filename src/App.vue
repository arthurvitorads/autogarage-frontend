
<script setup lang="ts">
import LoaderPage from './components/pages/LoaderPage.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
</script>
<template>
  <LoaderPage />
  <ConfirmDialog />
  <Toast position="top-right" />
  <RouterView />
</template>