<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Panel from 'primevue/panel'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable, { DataTablePageEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

import { IAdmUsuario } from '@/interface/pages/UsuarioPage'

import { useUtilStore } from '@/stores/util.store'

import { getUsers } from '@/services/user.service'
import { useAppToast } from '@/services/toast.service'
import { formatDateTime } from '@/services/util.service'

const { normalizeError, setLoading } = useUtilStore()

const toastService = useAppToast();

// paginacao
const limite = ref(20)
const pagina = ref(1)
const total = ref(0)

const filtro = ref('')

const usuarios = ref<IAdmUsuario[]>([])

function search() {
  pagina.value = 1
  loadUsers()
}

function changePage(event: DataTablePageEvent) {
	pagina.value = event.page + 1
	limite.value = event.rows

	loadUsers()
}

function newUser() {
	console.log('Novo')
}

function editUser(usuario: IAdmUsuario) {
	console.log('Editar', usuario)
}

async function loadUsers() {
  setLoading(true)

  try {
    const resultado = await getUsers(pagina.value, limite.value, filtro.value)

    usuarios.value = resultado.dados.usuarios
    total.value = resultado.dados.pagination.total

  } catch (error) {
		toastService.error(normalizeError(error))

    usuarios.value = []
    total.value = 0

  } finally {
    setLoading(false)
  }
}

onMounted(() => {
  loadUsers()
})
</script>
<template>
  <div class="flex flex-col h-full min-h-0 gap-4 p-6">
    <div class="flex items-center justify-between shrink-0">
      <span class="text-2xl font-bold">Usuários</span>
      <Button
        label="Novo"
        icon="pi pi-plus"
        @click="newUser"
      />
    </div>

    <Panel class="flex-1 min-h-0">

      <div class="flex flex-col h-full min-h-0 gap-4">
				<div class="flex items-end justify-between shrink-0">
          <div class="flex gap-2 w-full max-w-md">
            <InputText
              v-model="filtro"
              placeholder="Pesquisar usuários..."
              class="flex-1 min-w-0"
              @keyup.enter="search"
            />

            <Button
              icon="pi pi-search"
              @click="search"
            />
          </div>
        </div>
				<DataTable
					:value="usuarios"
					dataKey="cn_usuario"
					class="tabela-full flex-1 min-h-0"
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
					<Column header="Ações" style="width: 90px">
						<template #body="{ data }">
							<Button icon="pi pi-pencil" severity="secondary" text rounded
								v-tooltip.top="'Editar usuário'" @click="editUser(data)" />
						</template>
					</Column>
					<Column field="an_nome" header="Nome" />
					<Column field="an_email" header="E-mail" />
					<Column field="an_perfil" header="Perfil" />
					<Column field="bo_sts_reg" header="Status">
						<template #body="{ data }">
							<Tag :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'" :severity="data.bo_sts_reg? 'success': 'danger'" />
						</template>
					</Column>
					<Column field="dt_inc" header="Dt. inclusão">
						<template #body="{ data }">
							<span>{{ formatDateTime(data.dt_inc) }}</span>
						</template>
					</Column>
					<Column field="dt_alt" 		header="Dt. alteração">
						<template #body="{ data }">
							<span>{{ formatDateTime(data.dt_alt) }}</span>
						</template>
					</Column>
				</DataTable>
      </div>
    </Panel>
  </div>
</template>
