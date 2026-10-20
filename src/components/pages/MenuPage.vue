<script setup lang="ts">

import logoClara from '@/assets/img/logo_clara.png'

import { ref, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import PanelMenu, { type PanelMenuPanelOpenEvent } from 'primevue/panelmenu'

defineProps<{
  visible: boolean
}>()

const route = useRoute()

const expandedKeys = ref<Record<string, boolean>>({})

const modules = [
  {
    key: 'geral',
    label: 'Geral',
    icon: 'th-large',
    items: [{ key: 'geral:home', label: 'Home', icon: 'home', route: '/' }],
  },
  {
    key: 'cadastros',
    label: 'Cadastros',
    icon: 'folder',
    items: [
      { key: 'cadastros:pessoa', label: 'Pessoa', icon: 'users', route: '/pessoa' },
    ],
  },
  {
    key: 'admin',
    label: 'Administração',
    icon: 'database',
    items: [
      { key: 'admin:usuario', label: 'Usuário', icon: 'user-plus', route: '/usuario' },
      { key: 'admin:perfil', label: 'Perfil', icon: 'book', route: '/perfil' }
    ],
  },
]

function onPanelOpen(event: PanelMenuPanelOpenEvent) {
  expandedKeys.value = { [event.item.key]: true }
}

function openCurrentModule() {
  const current = modules.find((m) =>
    m.items.some((i) =>
      i.route === '/'
        ? route.path === '/'
        : route.path === i.route || route.path.startsWith(i.route + '/')
    )
  )

  expandedKeys.value = current
    ? { [current.key]: true }
    : {}
}

watch(() => route.path, openCurrentModule)

onMounted(openCurrentModule)
</script>

<template>
  <aside class="menu" :class="{ 'menu--collapsed': !visible }">
    <div class="menu-content">
      <div class="menu-header">
        <img :src="logoClara" alt="autoGarage" class="menu-logo" />
      </div>
      <nav class="menu-nav">
        <PanelMenu 
          class="menu-panel" 
          :model="modules" 
          v-model:expandedKeys="expandedKeys" 
          @panelOpen="onPanelOpen"
        >
          <template #item="{ item, active }">
            <RouterLink 
              v-if="item.route" 
              :to="item.route" 
              v-slot="{ href, navigate, isActive }"
            >
              <a 
                v-ripple 
                class="menu-link" 
                :class="{ 'menu-link--active': isActive }" 
                :href="href" 
                @click="navigate"
              >
                <i :class="`pi pi-${item.icon}`"></i>
                <span>{{ item.label }}</span>
              </a>
            </RouterLink>

            <a v-else v-ripple class="menu-link menu-link--module">
              <i :class="`pi pi-${item.icon}`"></i>
              <span class="menu-link-label">{{ item.label }}</span>
              <i :class="active ? 'pi pi-angle-up' : 'pi pi-angle-down'"></i>
            </a>
          </template>
        </PanelMenu>
      </nav>
    </div>
  </aside>
</template>

<style scoped>
.menu {
  width: 260px;
  flex-shrink: 0;
  overflow: hidden;

  background: #17191e;
  color: #fff;

  transition: width 0.25s ease;
}

.menu--collapsed {
  width: 0;
}

.menu-content {
  width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.menu-header {
  height: 64px;
  flex-shrink: 0;

  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px;

  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.menu-logo {
  width: 250px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}

.menu-nav {
  flex: 1;
  overflow-y: auto;
  padding: 12px 8px;
}

.menu-link {
  display: flex;
  align-items: center;
  gap: 12px;

  padding: 10px 13px;
  border-radius: 8px;

  color: #aeb2ba;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;

  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.menu-link--active {
  background: rgba(255, 115, 0, 0.13);
  color: #ff7300;
}

.menu-link--module {
  font-weight: 700;
  letter-spacing: 0.4px;
}

.menu-link-label {
  flex: 1;
}

.menu-panel {
  --p-panelmenu-gap: 4px;
}

.menu-panel :deep(.p-panelmenu-panel),
.menu-panel :deep(.p-panelmenu-header-content),
.menu-panel :deep(.p-panelmenu-content) {
  background: transparent;
  border: none;
  color: inherit;
}

.menu-panel :deep(.p-panelmenu-submenu) {
  padding-left: 12px;
}
</style>