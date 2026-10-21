<script setup lang="ts">
import { computed, ref } from 'vue'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ManutPessoaDialog from '@/components/dialogs/ManutPessoaDialog.vue'

import type { Pessoa } from '@/models/pessoa'

import { normalizeString, unMaskDocument } from '@/services/util.service'

// A futura API alimentará a coleção. Os cadastros não são persistidos localmente.
const pessoas = ref<Pessoa[]>([])

// paginação e filtro
const limite = ref(20)
const primeiroRegistro = ref(0)
const filtro = ref('')
const pesquisa = ref('')

// form
const manutPessoaVisible = ref(false)
const selectPessoa = ref<Pessoa | null>(null)

const pessoasFiltradas = computed(() => pessoas.value.filter(pessoa => {
  const termo = normalizeString(pesquisa.value)
  const documento = unMaskDocument(pesquisa.value).toUpperCase()
  const nome = pessoa.tipo === 'PF' ? pessoa.nome : pessoa.razaoSocial
  const nomeFantasia = pessoa.tipo === 'PJ' ? pessoa.nomeFantasia : ''
  const documentoPessoa = unMaskDocument(pessoa.tipo === 'PF' ? pessoa.cpf : pessoa.cnpj).toUpperCase()

  return !termo ||
    [nome, nomeFantasia, pessoa.email].some(valor => normalizeString(valor).includes(termo)) ||
    (!!documento && documentoPessoa.includes(documento))
}))

function search() {
  pesquisa.value = filtro.value.trim()
  primeiroRegistro.value = 0
}

function newPessoa() {
  selectPessoa.value = null
  manutPessoaVisible.value = true
}

function editPessoa(pessoa: Pessoa) {
  selectPessoa.value = pessoa
  manutPessoaVisible.value = true
}
</script>

<template>
  <div class="flex flex-col h-full gap-4">
    <div class="flex flex-col flex-1 min-h-0 border border-surface-200 rounded-xl">
      <div class="flex flex-wrap justify-between gap-3 m-5">
        <div class="flex gap-2 w-140 max-w-full">
          <InputText
            v-model="filtro"
            placeholder="Pesquisar por nome, CPF/CNPJ ou e-mail..."
            aria-label="Pesquisar pessoas"
            class="flex-1 min-w-0"
            @keyup.enter="search"
          />
          <Button icon="pi pi-search" aria-label="Pesquisar" @click="search" />
        </div>
        <Button label="Novo" icon="pi pi-plus" @click="newPessoa" />
      </div>
      <div class="flex-1 min-h-0 mx-2">
        <DataTable
          :value="pessoasFiltradas"
          dataKey="id"
          size="small"
          stripedRows
          scrollable
          scrollHeight="flex"
          tableStyle="min-width: 65rem"
          paginator
          v-model:first="primeiroRegistro"
          :rows="limite"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
          currentPageReportTemplate="Total: {totalRecords}"
        >
          <Column header="Ações" class="w-5">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" severity="secondary" text rounded
                aria-label="Editar pessoa" v-tooltip.top="'Editar pessoa'" @click="editPessoa(data)" />
            </template>
          </Column>
          <Column field="id" header="Código" />
          <Column header="Nome / Razão social">
            <template #body="{ data }">
              {{ data.tipo === 'PF' ? data.nome : data.razaoSocial }}
            </template>
          </Column>
          <Column field="tipo" header="Tipo" />
          <Column header="CPF / CNPJ">
            <template #body="{ data }">
              {{ data.tipo === 'PF' ? data.cpf : data.cnpj }}
            </template>
          </Column>
          <Column header="Categorias">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Tag v-if="data.bo_categ_cliente" value="Cliente" severity="secondary" />
                <Tag v-if="data.bo_categ_func" value="Funcionário" severity="secondary" />
              </div>
            </template>
          </Column>
          <Column field="telefone" header="Telefone" />
          <Column field="email" header="E-mail" />
          <Column header="Status">
            <template #body="{ data }">
              <Tag :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'" :severity="data.bo_sts_reg ? 'success' : 'danger'" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
  <ManutPessoaDialog v-model:visible="manutPessoaVisible" :pessoa="selectPessoa" :pessoas="pessoas" />
</template>
