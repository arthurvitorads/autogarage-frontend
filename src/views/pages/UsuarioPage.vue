<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

import GridPage from '@/components/pages/GridPage.vue'
import ManutUserDialog from '@/components/dialogs/ManutUserDialog.vue'

import type { IAdmUsuario } from '@/interface/pages/UsuarioPage'

import { getUsers } from '@/services/user.service'
import { formatDateTime } from '@/services/util.service'

import { useUtilStore } from '@/stores/util.store'

import UsuarioPageConfig from '@/config/UsuarioPageConfig.json'

const grid = useTemplateRef('grid')
const filter = ref('')

// form
const manutUserVisible = ref(false)
const selectUser = ref<IAdmUsuario | null>(null)

function newUser() {
  selectUser.value = null
  manutUserVisible.value = true
}

function editUser(user: IAdmUsuario) {
  selectUser.value = user
  manutUserVisible.value = true
}

onMounted(() => grid.value?.loadGrid())
const { canWrite } = useUtilStore()

function onGridAction({ action, data }: { action: string; data: IAdmUsuario }) {
  if (action === 'edit') editUser(data)
}
</script>
<template>
  <div class="grid-page flex flex-col h-full min-h-0 min-w-0 gap-4">
    <!-- filtro -->
    <div class="flex flex-col flex-1 min-h-0 min-w-0 border border-surface-200 rounded-xl">
      <div class="flex justify-between m-5">
        <div class="flex justify-center gap-2 w-140">
          <InputText v-model="filter" placeholder="Digite o que deseja pesquisar..." class="flex-1 min-w-0"
            :disabled="grid?.loading" @keyup.enter="grid?.loadGrid(filter.trim())" />
          <Button icon="pi pi-search" :disabled="grid?.loading" @click="grid?.loadGrid(filter.trim())" />
        </div>
        <div class="flex">
          <Button v-if="canWrite('ADMINISTRACAO')" label="Novo" icon="pi pi-plus" @click="newUser" />
        </div>
      </div>

      <div class="flex-1 min-h-0 min-w-0" style="margin: 0px 8px 0px 8px">
        <GridPage ref="grid" :fetch-page="getUsers" :data-key="UsuarioPageConfig.dataKey"
          :columns="UsuarioPageConfig.columns" table-min-width="50rem" :action-header="UsuarioPageConfig.actionHeader"
          :actions="canWrite('ADMINISTRACAO') ? UsuarioPageConfig.actions : []" @action="onGridAction">
          <template #cell-bo_sts_reg="{ data }">
            <Tag :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'" :severity="data.bo_sts_reg ? 'success' : 'danger'" />
          </template>
          <template #cell-dt_inc="{ data }">
            <span>{{ formatDateTime(data.dt_inc) }}</span>
          </template>
          <template #cell-dt_alt="{ data }">
            <span>{{ formatDateTime(data.dt_alt) }}</span>
          </template>
        </GridPage>
      </div>
    </div>
  </div>
  <ManutUserDialog v-model:visible="manutUserVisible" :user="selectUser" @saved="grid?.loadGrid()" />
</template>
