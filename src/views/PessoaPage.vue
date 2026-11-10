<script setup lang="ts">
import { onMounted, ref } from 'vue'

import DataTable, { DataTablePageEvent } from 'primevue/datatable'
import Skeleton from 'primevue/skeleton'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

import type { Pessoa } from '@/models/pessoa.model'

import { ICadPessoa } from '@/interface/interface-pages/PessoaPage'

import ManutPessoaDialog from '@/components/dialogs/ManutPessoaDialog.vue'

import { useUtilStore } from '@/stores/util.store'

import { getPeople } from '@/services/person.service'
import { useAppToast } from '@/services/toast.service'
import { formatDateTime, maskCpf, maskCnpj, maskTelefone } from '@/services/util.service'

const { normalizeError, setLoading, canWrite } = useUtilStore()

const toastService = useAppToast()

// paginacao
const limit = ref(20)
const page = ref(1)
const total = ref(0)

// skeleton
const skeletonColumns = [
  'Editar',
  'Código',
  'Nome',
  'Tipo',
  'Documento',
  'Categorias',
  'Telefone',
  'E-mail',
  'Ativo',
  'Dt. inclusão',
  'Dt. alteração',
]

const loadingGrid = ref(false)

const filter = ref('')

// form
const manutPessoaVisible = ref(false)
const selectedPessoa = ref<Pessoa | null>(null)

const people = ref<ICadPessoa[]>([])

function search() {
  if (loadingGrid.value) return

  page.value = 1
  loadPeople()
}

function changePage(event: DataTablePageEvent) {
  if (loadingGrid.value) return

  page.value = event.page + 1
  limit.value = event.rows
  loadPeople()
}

function newPessoa() {
  selectedPessoa.value = null
  manutPessoaVisible.value = true
}

function editPessoa(pessoa: ICadPessoa) {
  const endereco = pessoa.endereco
  const dados = {
    cn_pessoa: pessoa.cn_pessoa,
    bo_categ_cliente: pessoa.bo_categ_cliente,
    bo_categ_func: pessoa.bo_categ_func,
    bo_sts_reg: pessoa.bo_sts_reg,
    email: pessoa.an_email ?? '',
    telefone: pessoa.an_telefone ?? '',
    cargo: pessoa.an_cargo ?? '',
    nm_comissao_func: pessoa.nm_comissao_func ?? 0,
    endereco: {
      cep: endereco?.ca_cep ?? '',
      logradouro: endereco?.an_logradouro ?? '',
      numero: endereco?.an_numero ?? '',
      complemento: endereco?.an_complemento ?? '',
      bairro: endereco?.an_bairro ?? '',
      cidade: endereco?.an_cidade ?? '',
      uf: endereco?.ca_uf ?? '',
    }
  }

  selectedPessoa.value = pessoa.ca_tipo === 'PF' ?
    {
      ...dados,
      tipo: 'PF',
      nome: pessoa.an_nome ?? '',
      cpf: pessoa.ca_cpf ?? '',
    } : {
      ...dados,
      tipo: 'PJ',
      razaoSocial: pessoa.an_razao_social ?? '',
      nomeFantasia: pessoa.an_nome_fantasia ?? '',
      cnpj: pessoa.ca_cnpj ?? '',
    }

  manutPessoaVisible.value = true
  }

async function loadPeople() {
  loadingGrid.value = true

  try {
    const result = await getPeople(page.value, limit.value, filter.value)

    people.value = result.dados
    total.value = result.pagination.total
  } catch (error) {
    toastService.error(normalizeError(error))
    people.value = []
    total.value = 0
  } finally {
    loadingGrid.value = false
  }
}

onMounted(async () => {
  setLoading(true)

  try {
    await loadPeople()
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
            placeholder="Pesquise pelo nome, documento, e-mail..."
            class="flex-1 min-w-0"
            :disabled="loadingGrid"
            @keyup.enter="search"
          />
          <Button icon="pi pi-search" :disabled="loadingGrid" @click="search" />
        </div>
        <div class="flex">
          <Button v-if="canWrite('CADASTROS')" label="Novo" icon="pi pi-plus" @click="newPessoa" />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0" style="margin: 0px 8px 0px 8px">
        <DataTable
          :pt="{
            emptyMessage: { class: 'hidden' },
          }"
          :value="people"
          :aria-busy="loadingGrid"
          dataKey="cn_pessoa"
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
            <Column header="Editar" class="min-w-5">
              <template #body="{ data }">
                <Button
                  v-if="canWrite('CADASTROS')"
                  icon="pi pi-pencil"
                  severity="secondary"
                  text
                  rounded
                  @click="editPessoa(data)"
                />
              </template>
            </Column>
            <Column field="cn_pessoa" header="Código" :bodyStyle="{ textAlign: 'end' }" />
            <Column header="Nome" class="min-w-100">
              <template #body="{ data }">{{
                data.ca_tipo === 'PF' ? data.an_nome : data.an_razao_social
              }}</template>
            </Column>
            <Column field="ca_tipo" header="Tipo">
              <template #body="{ data }">{{
                data.ca_tipo === 'PF' ? 'Física' : 'Juridica'
              }}</template>
            </Column>
            <Column header="Documento" class="min-w-40">
              <template #body="{ data }">{{
                data.ca_tipo === 'PF' ? maskCpf(data.ca_cpf ?? '') : maskCnpj(data.ca_cnpj ?? '')
              }}</template>
            </Column>
            <Column header="Categorias">
              <template #body="{ data }">
                <div class="flex gap-1">
                  <Tag v-if="data.bo_categ_cliente" value="Cliente" severity="secondary" />
                  <Tag v-if="data.bo_categ_func" value="Funcionário" severity="secondary" />
                </div>
              </template>
            </Column>
            <Column header="Telefone" class="min-w-40">
              <template #body="{ data }">{{ maskTelefone(data.an_telefone ?? '') }}</template>
            </Column>
            <Column field="an_email" header="E-mail" />
            <Column header="Status">
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
  <ManutPessoaDialog
    v-model:visible="manutPessoaVisible"
    :person="selectedPessoa"
    @saved="loadPeople"
  />
</template>
