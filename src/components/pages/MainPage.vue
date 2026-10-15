<script setup lang="ts">
import { ref } from 'vue'

import HeaderPage from '@/components/pages/HeaderPage.vue'
import MenuPage from '@/components/pages/MenuPage.vue'

const showMenu = ref(true)
</script>

<template>
  <div class="home-layout">
    <MenuPage :visible="showMenu" />

    <div class="home-main">
      <HeaderPage @toggle-menu="showMenu = !showMenu" />

      <main class="home-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.home-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.home-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.home-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px;
}
</style>
