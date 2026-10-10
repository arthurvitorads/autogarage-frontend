<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import Toolbar from 'primevue/toolbar'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Menu from 'primevue/menu'

import { getUsuarioLogado, logout } from '../../services/authService'

const router = useRouter()

const usuario = getUsuarioLogado()
const menu = ref()

const nome = computed(() => usuario?.nome || 'Usuário')
const email = computed(() => usuario?.email || '')
const inicial = computed(() => nome.value.charAt(0).toUpperCase())

const itensMenu = [
  {
    label: 'Sair',
    icon: 'pi pi-sign-out',
    class: 'menu-sair',
    command: () => handleSair(),
  },
]

function toggleMenu(event: Event) {
  menu.value.toggle(event)
}

async function handleSair() {
  nextTick()

  await logout()

  router.push('/login')
}
</script>

<template>
  <Toolbar>
    <template #end>
      <div>
        <Button
          class=""
          text
          label="Menu do usuário"
          @click="toggleMenu"
        >
          <Avatar
            :label="inicial"
            shape="circle"
            class="profile-avatar"
          />

          <div class="profile-info">
            <strong>{{ nome }}</strong>
            <small>{{ email }}</small>
          </div>

          <i class="pi pi-chevron-down profile-arrow"></i>
        </Button>

        <Menu
          ref="menu"
          :model="itensMenu"
          popup
        />
      </div>
    </template>
  </Toolbar>
</template>

<style scoped>
.header-bar {
  height: 74px;
  position: sticky;
  top: 0;
  z-index: 900;

  border: none;
  border-bottom: 1px solid var(--p-surface-200);
  border-radius: 0;

  padding: 0 28px;
  background: var(--p-surface-0);
}
.profile-avatar {
  background: #fff0e5;
  color: #ff7300;
  flex-shrink: 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
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
  margin-left: 2px;
}

@media (max-width: 768px) {
  .header-bar {
    padding: 0 12px;
  }

  .profile-info,
  .profile-arrow {
    display: none;
  }

  .header-actions {
    gap: 2px;
  }
}
</style>
