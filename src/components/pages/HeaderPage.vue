<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import Toolbar from 'primevue/toolbar'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Menu from 'primevue/menu'

import { logout } from '@/services/auth.service'

import { useUtilStore } from '@/stores/util.store'

const emit = defineEmits<{
  'toggle-menu': []
}>()

const router = useRouter()
const route = useRoute()
const titulo = computed(() => String(route.meta.title || 'AutoGarage').split(' | ')[0])

const { user } = storeToRefs(useUtilStore())

const menu = ref()

const nome = computed(() => user.value?.an_nome || 'Usuário')
const perfil = computed(() => user.value?.an_perfil || '')
const inicial = computed(() => nome.value.charAt(0).toUpperCase())

const itensMenu = [
  {
    label: 'Sair',
    icon: 'pi pi-sign-out',
    command: () => handleSair(),
  },
]

function toggleUserMenu(event: Event) {
  menu.value.toggle(event)
}

async function handleSair() {
  await logout()

  router.push('/login')
}
</script>

<template>
  <Toolbar class="header-bar">
    <template #start>
      <div class="header-start">
        <Button
          text
          rounded
          severity="secondary"
          icon="pi pi-bars"
          aria-label="Abrir ou fechar menu"
          @click="emit('toggle-menu')"
        />
        <h1 class="page-title">{{ titulo }}</h1>
      </div>
    </template>

    <template #end>
      <Button text aria-haspopup="true" aria-controls="user-menu" @click="toggleUserMenu">
        <Avatar :label="inicial" shape="circle" class="profile-avatar" />

        <div class="profile-info">
          <strong>{{ nome }}</strong>
          <small>{{ perfil }}</small>
        </div>

        <i class="pi pi-chevron-down profile-arrow"></i>
      </Button>

      <Menu ref="menu" id="user-menu" :model="itensMenu" popup />
    </template>
  </Toolbar>
</template>

<style scoped>
.header-bar {
  border: none;
  border-bottom: 1px solid var(--p-surface-200);
  border-radius: 0;
  padding: 8px 16px;
}

.header-start {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}


.page-title {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 600;
  line-height: 1.3;
  color: var(--p-text-color);
  overflow-wrap: anywhere;
}

.header-start :deep(.p-button) {
  flex-shrink: 0;
}

.header-bar :deep(.p-toolbar-start) {
  flex: 1;
  min-width: 0;
}

.profile-avatar {
  background: #fff0e5;
  color: #ff7300;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  margin: 0 8px;
}

.profile-info strong {
  font-size: 13px;
  font-weight: 600;
}

.profile-info small {
  font-size: 10px;
  color: var(--p-text-muted-color);
}

.profile-arrow {
  font-size: 12px;
}

@media (max-width: 768px) {
  .header-brand,
  .profile-info,
  .profile-arrow {
    display: none;
  }
}
</style>