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
import { getPerfil } from '@/services/perfil.service'

const { normalizeError, setLoading } = useUtilStore()

const toastService = useAppToast();

// paginacao
const limite = ref(20)
const pagina = ref(1)
const total = ref(0)

const filtro = ref('')

// skeleton
const colunasSkeleton = ['Ações', 'Descrição', 'Status', 'Dt. inclusão', 'Dt. alteração']
const loadingGrid = ref(false)

// form
const manutPerfilVisible = ref(false)
const selectedPerfil = ref<IAdmPerfil | null>(null)

const perfil = ref<IAdmPerfil[]>([])

function search() {
  if (loadingGrid.value) return

  pagina.value = 1
  loadPerfil()
}

function changePage(event: DataTablePageEvent) {
  if (loadingGrid.value) return

	pagina.value = event.page + 1
	limite.value = event.rows

	loadPerfil()
}

function newPerfil() {
  selectedPerfil.value = null
  manutPerfilVisible.value = true
}

function editPerfil(perfil: IAdmPerfil) {
  selectedPerfil.value = perfil
  manutPerfilVisible.value = true
}

async function loadPerfil() {
  loadingGrid.value = true

  try {
    const resultado = await getPerfil(pagina.value, limite.value, filtro.value)

    perfil.value = resultado.dados.perfil
    total.value = resultado.dados.pagination.total

  } catch (error) {
		toastService.error(normalizeError(error))

    perfil.value = []
    total.value = 0

  } finally {
    loadingGrid.value = false
  }
}

onMounted(async () => {
  setLoading(true)
	
  try {
    await loadPerfil()
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
						v-model="filtro"
						placeholder="Digite o que deseja pesquisar..."
						class="flex-1 min-w-0"
						:disabled="loadingGrid"
						@keyup.enter="search"
					/>
					<Button
						icon="pi pi-search"
						:disabled="loadingGrid"
						@click="search"
					/>
				</div>
				<div class="flex">
					<Button
						label="Novo"
						icon="pi pi-plus"
						@click="newPerfil"
					/>
				</div>
			</div>

			<div class="flex-1 min-h-0 min-w-0" style="margin: 0px 8px 0px 8px;">
				<DataTable
					:pt="{
						emptyMessage: { class: 'hidden' }
					}"
					:value="perfil"
					:aria-busy="loadingGrid"
					dataKey="cn_perfil"
					size="small"
					stripedRows
					scrollable
					scrollHeight="flex"
					tableStyle="min-width: 50rem"
					lazy
					paginator
					:first="(pagina - 1) * limite"
					:rows="limite"
					:totalRecords="total"
					paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
					currentPageReportTemplate="Total: {totalRecords}"
					@page="changePage"
				>
          <template v-if="loadingGrid">
            <Column v-for="header in colunasSkeleton" :key="header" :header="header">
              <template #body>
                <Skeleton height="2.8rem" />
              </template>
            </Column>
          </template>
          <template v-else>
						<Column header="Ações" class="min-w-5">
							<template #body="{ data }">
								<Button icon="pi pi-pencil" severity="secondary" text rounded
									v-tooltip.top="'Editar'" @click="editPerfil(data)" />
							</template>
						</Column>
						<Column class="min-w-30" field="cn_perfil" header="Código" />
						<Column field="an_descr" header="Nome" />
						<Column class="min-w-30" field="bo_sts_reg" header="Status">
							<template #body="{ data }">
								<Tag :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'" :severity="data.bo_sts_reg? 'success': 'danger'" />
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
  <ManutPerfilDialog v-model:visible="manutPerfilVisible" :perfil="selectedPerfil" @saved="loadPerfil" />
</template>
