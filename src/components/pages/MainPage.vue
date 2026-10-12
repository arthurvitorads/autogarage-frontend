<script setup lang="ts">
import { ref } from 'vue'

import HeaderPage from '@/components/pages/HeaderPage.vue'
import MenuPage from '@/components/pages/MenuPage.vue'

const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="home-layout">
    <MenuPage
      :collapsed="sidebarCollapsed"
      @toggle="toggleSidebar"
    />

    <div
      class="home-main"
      :class="{
        'home-main--expanded': sidebarCollapsed
      }"
    >
      <HeaderPage />

      <main class="home-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>