<script setup lang="ts">
import { onMounted, ref } from 'vue'

import DataTable, { DataTablePageEvent } from 'primevue/datatable'
import Skeleton from 'primevue/skeleton'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import type { Pessoa } from '@/models/pessoa'

import { ICadPessoa } from '@/interface/interface-pages/PessoaPage'

import ManutPessoaDialog from '@/components/dialogs/ManutPessoaDialog.vue'

import { useUtilStore } from '@/stores/util.store'

import { getPerson, personToForm } from '@/services/person.service'
import { useAppToast } from '@/services/toast.service'
import { formatDateTime } from '@/services/util.service'

const { normalizeError, setLoading } = useUtilStore()

const toastService = useAppToast();

// paginacao
const limite = ref(20)
const pagina = ref(1)
const total = ref(0)

const filtro = ref('')

// skeleton
const colunasSkeleton = [
  'Ações',
  'Código',
  'Nome',
  'Tipo',
  'Documento',
  'Categorias',
  'Telefone',
  'E-mail',
  'Ativo',
  'Dt. inclusão',
  'Dt. alteração'
]

const loadingGrid = ref(false)

// form
const manutPersonVisible = ref(false)
const selectedPerson = ref<Pessoa | null>(null)
const enderecoVisible = ref(false)
const pessoaEndereco = ref<ICadPessoa | null>(null)
function showEndereco(pessoa: ICadPessoa) {
  pessoaEndereco.value = pessoa
  enderecoVisible.value = true
}

const personData = ref<ICadPessoa[]>([])

function search() {
  if (loadingGrid.value)
    return

  pagina.value = 1
  loadPerson()
}

function changePage(event: DataTablePageEvent) {
  if (loadingGrid.value)
    return

  pagina.value = event.page + 1
  limite.value = event.rows
  loadPerson()
}

function newPerson() {
  selectedPerson.value = null
  manutPersonVisible.value = true
}

function editPerson(pessoa: ICadPessoa) {
  selectedPerson.value = personToForm(pessoa)
  manutPersonVisible.value = true
}

async function loadPerson() {
  loadingGrid.value = true

  try {
    const resultado = await getPerson(pagina.value, limite.value, filtro.value)

    personData.value = resultado.dados.pessoa
    total.value = resultado.dados.pagination.total
  } catch (error) {
    toastService.error(normalizeError(error))
    personData.value = []
    total.value = 0
  } finally {
    loadingGrid.value = false
  }
}

onMounted(async () => {
  setLoading(true)

  try {
    await loadPerson()
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
            placeholder="Pesquise pelo nome, documento, e-mail..."
            class="flex-1 min-w-0"
            :disabled="loadingGrid"
            @keyup.enter="search"
          />
          <Button icon="pi pi-search" :disabled="loadingGrid" @click="search" />
        </div>
        <div class="flex">
          <Button label="Novo" icon="pi pi-plus" @click="newPerson" />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0" style="margin: 0px 8px 0px 8px;">
        <DataTable
          :pt="{
          	emptyMessage: { class: 'hidden' }
          }"
          :value="personData"
          :aria-busy="loadingGrid"
          dataKey="cn_pessoa"
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
                <Button
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  @click="editPerson(data)"
                />
              </template>
            </Column>
            <Column header="Endereço" class="min-w-20">
              <template #body="{ data }">
                <Button
                  icon="pi pi-info-circle"
                  severity="info"
                  text
                  rounded
                  aria-label="Consultar endereço"
                  v-tooltip.top="'Consultar endereço'"
                  @click="showEndereco(data)"
                />
              </template>
            </Column>
            <Column field="cn_pessoa" header="Código" />
            <Column header="Nome" class="min-w-100">
              <template #body="{ data }">{{ data.ca_tipo === 'PF' ? data.an_nome : data.an_razao_social }}</template>
            </Column>
            <Column field="ca_tipo" header="Tipo">
              <template #body="{ data }">{{ data.ca_tipo === 'PF' ? 'Física' : 'Juridica' }}</template>
            </Column>
            <Column header="Documento">
              <template #body="{ data }">{{ data.ca_tipo === 'PF' ? data.ca_cpf : data.ca_cnpj }}</template>
            </Column>
            <Column header="Categorias">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Tag v-if="data.bo_categ_cliente" value="Cliente" severity="secondary" />
                  <Tag v-if="data.bo_categ_func" value="Funcionário" severity="secondary" />
                </div>
              </template>
            </Column>
            <Column field="an_telefone" header="Telefone" />
            <Column field="an_email" header="E-mail" />
            <Column header="Status">
              <template #body="{ data }">
                <Tag :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'" :severity="data.bo_sts_reg ? 'success' : 'danger'" />
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
  <ManutPessoaDialog v-model:visible="manutPersonVisible" :pessoa="selectedPerson" @saved="loadPerson" />
  <Dialog v-model:visible="enderecoVisible" modal header="Endereço da pessoa" :style="{ width: '40rem', maxWidth: '95vw' }">
    <div v-if="pessoaEndereco?.endereco" class="flex flex-col gap-2">
      <p class="font-semibold">{{ pessoaEndereco.an_nome || pessoaEndereco.an_razao_social }}</p>
      <p>{{ pessoaEndereco.endereco.an_logradouro }}, {{ pessoaEndereco.endereco.an_numero }}</p>
      <p v-if="pessoaEndereco.endereco.an_complemento">{{ pessoaEndereco.endereco.an_complemento }}</p>
      <p>{{ pessoaEndereco.endereco.an_bairro }}</p>
      <p>{{ pessoaEndereco.endereco.an_cidade }} / {{ pessoaEndereco.endereco.ca_uf }}</p>
      <p>CEP: {{ pessoaEndereco.endereco.ca_cep }}</p>
    </div>
    <p v-else>Endereço não cadastrado.</p>
  </Dialog>
</template>
