<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

import GridPage from '@/components/pages/GridPage.vue'
import ManutPerfilDialog from '@/components/dialogs/ManutPerfilDialog.vue'
import PerfilAcessosDialog from '@/components/dialogs/PerfilAcessosDialog.vue'

import type { IAdmPerfil } from '@/interface/interface-pages/PerfilPage'

import { formatDateTime } from '@/services/util.service'
import { getProfiles } from '@/services/perfil.service'

import { useUtilStore } from '@/stores/util.store'

import PerfilPageConfig from '@/config/PerfilPageConfig.json'

const { canWrite } = useUtilStore()

const grid = useTemplateRef('grid')
const filter = ref('')

// form
const manutProfileVisible = ref(false)
const selectProfile = ref<IAdmPerfil | null>(null)
const accessDialogVisible = ref(false)
const accessProfile = ref<IAdmPerfil | null>(null)

function newProfile() {
  selectProfile.value = null
  manutProfileVisible.value = true
}

function editProfile(profile: IAdmPerfil) {
  selectProfile.value = profile
  manutProfileVisible.value = true
}

function openAccess(profile: IAdmPerfil) {
  accessProfile.value = profile
  accessDialogVisible.value = true
}

onMounted(() => grid.value?.loadGrid())

function onGridAction({ action, data }: { action: string; data: IAdmPerfil }) {
  if (action === 'edit') editProfile(data)
  if (action === 'access') openAccess(data)
}
</script>
<template>
  <div class="grid-page flex flex-col h-full min-h-0 min-w-0 gap-4">
    <!-- filtro -->
    <div class="flex flex-col flex-1 min-h-0 min-w-0 border border-surface-200 rounded-xl">
      <div class="flex justify-between m-5">
        <div class="flex justify-center gap-2 w-140">
          <InputText
            v-model="filter"
            placeholder="Digite o que deseja pesquisar..."
            class="flex-1 min-w-0"
            :disabled="grid?.loading"
            @keyup.enter="grid?.loadGrid(filter.trim())"
          />
          <Button
            icon="pi pi-search"
            :disabled="grid?.loading"
            @click="grid?.loadGrid(filter.trim())"
          />
        </div>
        <div class="flex">
          <Button
            v-if="canWrite('ADMINISTRACAO')"
            label="Novo"
            icon="pi pi-plus"
            @click="newProfile"
          />
        </div>
      </div>

      <div class="flex-1 min-h-0 min-w-0" style="margin: 0px 8px 0px 8px">
        <GridPage
          ref="grid"
          :fetch-page="getProfiles"
          :data-key="PerfilPageConfig.dataKey"
          :columns="PerfilPageConfig.columns"
          table-min-width="50rem"
          :action-header="PerfilPageConfig.actionHeader"
          :actions="
            canWrite('ADMINISTRACAO')
              ? PerfilPageConfig.actions
              : PerfilPageConfig.actions.filter((item) => item.action !== 'edit')
          "
          @action="onGridAction"
        >
          <template #cell-bo_sts_reg="{ data }">
            <Tag
              :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'"
              :severity="data.bo_sts_reg ? 'success' : 'danger'"
            />
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
  <ManutPerfilDialog
    v-model:visible="manutProfileVisible"
    :profile="selectProfile"
    @saved="grid?.loadGrid()"
  />
  <PerfilAcessosDialog v-model:visible="accessDialogVisible" :profile="accessProfile" />
</template>
