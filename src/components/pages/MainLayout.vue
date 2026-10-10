<script setup lang="ts">
import { ref } from 'vue'

import HeaderComponent from '@/components/default/HeaderComponent.vue'
import MenuComponent from '@/components/default/MenuComponent.vue'

const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="home-layout">
    <MenuComponent
      :collapsed="sidebarCollapsed"
      @toggle="toggleSidebar"
    />

    <div
      class="home-main"
      :class="{
        'home-main--expanded': sidebarCollapsed
      }"
    >
      <HeaderComponent />

      <main class="home-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>