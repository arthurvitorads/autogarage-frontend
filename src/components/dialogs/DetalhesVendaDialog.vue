<script setup lang="ts">
import type { ISaleDetailsDialogProps } from '@/interface/dialog'
import Dialog from 'primevue/dialog'
import Fieldset from 'primevue/fieldset'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import type { IAdmVenda } from '@/interface/interface-pages/VendaPage'
import { formatCurrencyOrdem as formatOrderCurrency } from '@/services/ordem-servico.service'
import { formatDateTime } from '@/services/util.service'

defineProps<ISaleDetailsDialogProps>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()
</script>

<template>
  <Dialog
    :visible="visible"
    header="Detalhes da venda"
    modal
    :style="{ width: '76rem', maxWidth: '95vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="sale" class="flex flex-col gap-4">
      <h2 class="text-lg font-semibold">Venda #{{ String(sale.nu_numero).padStart(6, '0') }}</h2>
      <p>
        {{ formatDateTime(sale.dt_venda) }} —
        {{ sale.ca_origem === 'DIRETA' ? 'Venda avulsa' : 'Ordem de serviço' }}
      </p>
      <Fieldset legend="Cliente">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <p class="font-semibold">{{ sale.an_cliente }}</p>
          <p>{{ sale.ca_documento }}</p>
          <p>{{ sale.an_email }}</p>
          <p>{{ sale.an_telefone }}</p>
          <p class="sm:col-span-2">{{ sale.an_endereco || 'Endereço não informado' }}</p>
        </div>
      </Fieldset>
      <DataTable :value="sale.itens" size="small" scrollable tableStyle="min-width: 40rem">
        <Column field="an_descr" header="Descrição" /><Column
          field="ca_tipo"
          header="Tipo"
        /><Column field="qt_quantidade" header="Quantidade" />
        <Column header="Unitário"
          ><template #body="{ data }">{{ formatOrderCurrency(data.vl_unitario) }}</template></Column
        >
        <Column header="Total"
          ><template #body="{ data }">{{ formatOrderCurrency(data.vl_total) }}</template></Column
        >
      </DataTable>
      <p class="text-right text-xl font-bold">{{ formatOrderCurrency(sale.vl_total) }}</p>
      <p class="whitespace-pre-wrap">{{ sale.an_obs }}</p>
    </div>
    <template #footer><Button label="Fechar" @click="emit('update:visible', false)" /></template>
  </Dialog>
</template>
