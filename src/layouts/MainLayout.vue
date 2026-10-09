<script setup lang="ts">
import { ref } from 'vue'

import Sidebar from '../components/layout/Sidebar.vue'
import HeaderBar from '../components/layout/HeaderBar.vue'

import '../styles/home.css'

const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="home-layout">
    <Sidebar
      :collapsed="sidebarCollapsed"
      @toggle="toggleSidebar"
    />

    <div
      class="home-main"
      :class="{
        'home-main--expanded': sidebarCollapsed
      }"
    >
      <HeaderBar />

      <main class="home-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>