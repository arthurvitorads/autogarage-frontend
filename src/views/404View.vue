<script setup lang="ts">
import logoClara from '@/assets/img/logo_clara.png'
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center bg-neutral-900 px-6 text-center text-white">
    <img class="mb-8 w-72 max-w-full" :src="logoClara" alt="Logo do AutoGarage" />
    <p class="mb-2 text-lg font-semibold">404</p>
    <h1 class="text-3xl font-bold">Página não encontrada</h1>
    <RouterLink
      :to="{ name: 'home' }"
      class="mt-6 rounded-md bg-white px-4 py-2 font-medium text-neutral-900 hover:bg-neutral-200"
    >
      Voltar ao início
    </RouterLink>
  </main>
</template>
