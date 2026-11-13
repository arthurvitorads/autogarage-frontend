<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue'

import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

import GridPage from '@/components/pages/GridPage.vue'
import ManutPessoaDialog from '@/components/dialogs/ManutPessoaDialog.vue'

import type { Pessoa } from '@/models/pessoa.model'

import type { ICadPessoa } from '@/interface/interface-pages/PessoaPage'

import { getPeople } from '@/services/person.service'

import { useUtilStore } from '@/stores/util.store'

import config from '@/config/PessoaPageConfig.json'

const { canWrite } = useUtilStore()

const grid = useTemplateRef('grid')

const filter = ref('')

// form
const manutPessoaVisible = ref(false)
const selectedPessoa = ref<Pessoa | null>(null)

function newPessoa() {
  selectedPessoa.value = null
  manutPessoaVisible.value = true
}

function onGridAction({ action, data }: { action: string; data: ICadPessoa }) {
  if (action === 'edit') editPessoa(data)
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
      cn_estado: endereco?.cn_estado ?? '',
    },
  }

  selectedPessoa.value =
    pessoa.ca_tipo === 'PF'
      ? {
          ...dados,
          tipo: 'PF',
          nome: pessoa.an_nome ?? '',
          cpf: pessoa.ca_cpf ?? '',
        }
      : {
          ...dados,
          tipo: 'PJ',
          razaoSocial: pessoa.an_razao_social ?? '',
          nomeFantasia: pessoa.an_nome_fantasia ?? '',
          cnpj: pessoa.ca_cnpj ?? '',
        }

  manutPessoaVisible.value = true
}

onMounted(() => {
  grid.value?.loadGrid()
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
            :disabled="grid?.loading"
            @keyup.enter="grid?.loadGrid(filter)"
          />
          <Button icon="pi pi-search" :disabled="grid?.loading" @click="grid?.loadGrid(filter)" />
        </div>
        <div class="flex">
          <Button v-if="canWrite('CADASTROS')" label="Novo" icon="pi pi-plus" @click="newPessoa" />
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
        />
      </div>
    </div>
  </div>
  <ManutPessoaDialog
    v-model:visible="manutPessoaVisible"
    :person="selectedPessoa"
    @saved="grid?.loadGrid()"
  />
</template>
