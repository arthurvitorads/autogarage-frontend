<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Skeleton from 'primevue/skeleton'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable, { DataTablePageEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

import ManutPerfilDialog from '@/components/dialogs/ManutPerfilDialog.vue'

import { IAdmPerfil } from '@/interface/interface-pages/PerfilPage'

import { useUtilStore } from '@/stores/util.store'

import { useAppToast } from '@/services/toast.service'
import { formatDateTime } from '@/services/util.service'
import { getPerfil as getProfiles } from '@/services/perfil.service'

const { normalizeError, setLoading } = useUtilStore()

const toastService = useAppToast()

// paginacao
const limit = ref(20)
const page = ref(1)
const total = ref(0)

const filter = ref('')

// skeleton
const skeletonColumns = ['Ações', 'Descrição', 'Status', 'Dt. inclusão', 'Dt. alteração']
const loadingGrid = ref(false)

// form
const manutProfileVisible = ref(false)
const selectProfile = ref<IAdmPerfil | null>(null)

const profile = ref<IAdmPerfil[]>([])

function search() {
  if (loadingGrid.value) return

  page.value = 1
  loadProfiles()
}

function changePage(event: DataTablePageEvent) {
  if (loadingGrid.value) return

  page.value = event.page + 1
  limit.value = event.rows

  loadProfiles()
}

function newProfile() {
  selectProfile.value = null
  manutProfileVisible.value = true
}

function editProfile(profile: IAdmPerfil) {
  selectProfile.value = profile
  manutProfileVisible.value = true
}

async function loadProfiles() {
  loadingGrid.value = true

  try {
    const result = await getProfiles(page.value, limit.value, filter.value)

    profile.value = result.dados.perfil
    total.value = result.dados.pagination.total
  } catch (error) {
    toastService.error(normalizeError(error))

    profile.value = []
    total.value = 0
  } finally {
    loadingGrid.value = false
  }
}

onMounted(async () => {
  setLoading(true)

  try {
    await loadProfiles()
  } finally {
    setLoading(false)
  }
})
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
            :disabled="loadingGrid"
            @keyup.enter="search"
          />
          <Button icon="pi pi-search" :disabled="loadingGrid" @click="search" />
        </div>
        <div class="flex">
          <Button label="Novo" icon="pi pi-plus" @click="newProfile" />
        </div>
      </div>

      <div class="flex-1 min-h-0 min-w-0" style="margin: 0px 8px 0px 8px">
        <DataTable
          :pt="{
            emptyMessage: { class: 'hidden' },
          }"
          :value="profile"
          :aria-busy="loadingGrid"
          dataKey="cn_perfil"
          size="small"
          stripedRows
          scrollable
          scrollHeight="flex"
          tableStyle="min-width: 50rem"
          lazy
          paginator
          :first="(page - 1) * limit"
          :rows="limit"
          :totalRecords="total"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
          currentPageReportTemplate="Total: {totalRecords}"
          @page="changePage"
        >
          <template v-if="loadingGrid">
            <Column v-for="header in skeletonColumns" :key="header" :header="header">
              <template #body>
                <Skeleton height="2.8rem" />
              </template>
            </Column>
          </template>
          <template v-else>
            <Column header="Ações" class="min-w-5">
              <template #body="{ data }">
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  v-tooltip.top="'Editar'"
                  @click="editProfile(data)"
                />
              </template>
            </Column>
            <Column class="min-w-30" field="cn_perfil" header="Código" />
            <Column field="an_descr" header="Nome" />
            <Column class="min-w-30" field="bo_sts_reg" header="Status">
              <template #body="{ data }">
                <Tag
                  :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'"
                  :severity="data.bo_sts_reg ? 'success' : 'danger'"
                />
              </template>
            </Column>
            <Column class="min-w-50" field="dt_inc" header="Dt. inclusão">
              <template #body="{ data }">
                <span>{{ formatDateTime(data.dt_inc) }}</span>
              </template>
            </Column>
            <Column class="min-w-50" field="dt_alt" header="Dt. alteração">
              <template #body="{ data }">
                <span>{{ formatDateTime(data.dt_alt) }}</span>
              </template>
            </Column>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
  <ManutPerfilDialog
    v-model:visible="manutProfileVisible"
    :profile="selectProfile"
    @saved="loadProfiles"
  />
</template>
