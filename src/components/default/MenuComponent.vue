<script setup lang="ts">
logoEscura

import logoEscura from '@/assets/img/logoEscura.png'

import Button from 'primevue/button'

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>

<template>
  <aside
    class="sidebar"
    :class="{ 'sidebar--collapsed': collapsed }"
  >
    <!-- Cabeçalho -->
    <div class="sidebar-header">
      <div v-if="!collapsed" class="sidebar-brand">
        <img
          :src="logoEscura"
          alt="autoGarage"
          class="sidebar-logo"
        />

        <span class="sidebar-brand-name">
          auto<strong>Garage</strong>
        </span>
      </div>

      <img
        v-else
        :src="logoEscura"
        alt="autoGarage"
        class="sidebar-logo sidebar-logo--collapsed"
      />

      <Button
        text
        rounded
        severity="secondary"
        class="sidebar-toggle"
        :icon="collapsed ? 'pi pi-bars' : 'pi pi-times'"
        aria-label="Abrir ou fechar menu"
        @click="emit('toggle')"
      />
    </div>

    <!-- Navegação -->
    <nav class="sidebar-menu">
      <span v-if="!collapsed" class="modules-title">
        MÓDULOS
      </span>

      <RouterLink
        to="/home"
        class="sidebar-link"
        v-tooltip.right="collapsed ? 'Home' : undefined"
      >
        <i class="pi pi-home sidebar-link-icon"></i>
        <span v-if="!collapsed">Home</span>
      </RouterLink>

      <RouterLink
        to="/pessoas"
        class="sidebar-link"
        v-tooltip.right="collapsed ? 'Pessoas' : undefined"
      >
        <i class="pi pi-users sidebar-link-icon"></i>
        <span v-if="!collapsed">Pessoas</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;

  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;

  display: flex;
  flex-direction: column;

  background: #17191e;
  color: #fff;

  transition: width 0.25s ease;
}

.sidebar--collapsed {
  width: 82px;
}

/* Cabeçalho */

.sidebar-header {
  min-height: 74px;
  padding: 0 18px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.sidebar-logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
  flex-shrink: 0;
}

.sidebar-logo--collapsed {
  width: 38px;
  height: 38px;
}

.sidebar-brand-name {
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

.sidebar-brand-name strong {
  color: #ff7300;
}

.sidebar-toggle {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  color: #fff !important;
}

/* Estado recolhido */

.sidebar--collapsed .sidebar-header {
  padding: 0;
  justify-content: center;
  gap: 2px;
  flex-direction: column;
}

/* Menu */

.sidebar-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 20px 14px;
}

.modules-title {
  padding: 0 13px 10px;
  color: #ff7300;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.8px;
}

/* Links */

.sidebar-link {
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 12px;

  padding: 0 13px;
  border-radius: 8px;

  color: #aeb2ba;
  text-decoration: none;
  font-size: 13px;

  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}

.sidebar-link.router-link-active {
  background: rgba(255, 115, 0, 0.13);
  color: #ff7300;
}

.sidebar-link-icon {
  width: 20px;
  flex-shrink: 0;
  text-align: center;
  font-size: 17px;
}

.sidebar--collapsed .sidebar-link {
  justify-content: center;
  padding: 0;
}

@media (max-width: 768px) {
  .sidebar {
    width: 82px;
  }

  .sidebar-header {
    padding: 0;
    justify-content: center;
    flex-direction: column;
    gap: 2px;
  }

  .sidebar-brand {
    display: none;
  }

  .sidebar-link {
    justify-content: center;
    padding: 0;
  }

  .modules-title {
    display: none;
  }
}
</style>
