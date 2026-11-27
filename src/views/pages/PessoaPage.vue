<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

import GridPage from '@/components/pages/GridPage.vue'
import ManutPessoaDialog from '@/components/dialogs/ManutPessoaDialog.vue'

import { IGridActionEvent } from '@/interface/util'

import type { ICadPessoa } from '@/interface/tables'

import { getPeople } from '@/services/person.service'
import { maskCpf, maskCnpj, maskTelefone } from '@/services/util.service'

import { useUtilStore } from '@/stores/util.store'

import config from '@/config/PessoaPageConfig.json'

const { canWrite } = useUtilStore()

const grid = useTemplateRef('grid')

const filter = ref('')

// form
const manutPessoaVisible = ref(false)
const selectedPessoa = ref<ICadPessoa | null>(null)

function onGridAction({ action, data }: IGridActionEvent<ICadPessoa>) {
  switch (action) {
    case 'edit':
      if (data) openEdit(data)
      break
    default:
      break
  }
}

function openNewForm() {
  selectedPessoa.value = null
  manutPessoaVisible.value = true
}

function openEdit(data: ICadPessoa) {
  selectedPessoa.value = data

  manutPessoaVisible.value = true
}

onMounted(() => {
  grid.value?.loadGrid()
})
</script>
<template>
  <div class="grid-page flex flex-col h-full min-h-0 min-w-0 gap-4">
    <div class="flex flex-col flex-1 min-h-0 min-w-0 border border-surface-200 rounded-xl">
      <div class="flex justify-between m-5">
        <div class="flex justify-center gap-2 w-140">
          <InputText
            v-model="filter"
            placeholder="Pesquise pelo nome, documento, e-mail..."
            class="flex-1 min-w-0"
            :disabled="grid?.loading"
            @keyup.enter="grid?.loadGrid(filter)"
          />
          <Button icon="pi pi-search" :disabled="grid?.loading" @click="grid?.loadGrid(filter)" />
        </div>
        <div class="flex">
          <Button
            v-if="canWrite('CADASTROS')"
            label="Novo"
            icon="pi pi-plus"
            @click="openNewForm"
          />
        </div>
      </div>
      <div class="flex-1 min-h-0 min-w-0" style="margin: 0px 8px 0px 8px">
        <GridPage
          ref="grid"
          :fetchPage="getPeople"
          :data-key="config.dataKey"
          :columns="config.columns"
          :actions="canWrite('CADASTROS') ? config.actions : []"
          :actionHeader="config.actionHeader"
          @action="onGridAction"
        >
          <template #cell-an_nome="{ data }">
            {{ (data.ca_tipo === 'PF' ? data.an_nome : data.an_razao_social) ?? '' }}
          </template>
          <template #cell-ca_tipo="{ data }">
            {{ data.ca_tipo === 'PF' ? 'Física' : 'Jurídica' }}
          </template>
          <template #cell-ca_cpf="{ data }">
            {{ data.ca_tipo === 'PF' ? maskCpf(data.ca_cpf ?? '') : maskCnpj(data.ca_cnpj ?? '') }}
          </template>
          <template #cell-an_telefone="{ data }">{{
            maskTelefone(data.an_telefone ?? '')
          }}</template>
        </GridPage>
      </div>
    </div>
  </div>
  <ManutPessoaDialog
    v-model:visible="manutPessoaVisible"
    :pessoa="selectedPessoa"
    @onSave="grid?.loadGrid()"
  />
</template>
