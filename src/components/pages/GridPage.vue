<script setup lang="ts" generic="TRow extends object">
import { computed, ref, shallowRef } from 'vue'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

import { useAppToast } from '@/services/toast.service'

import { useUtilStore } from '@/stores/util.store'

const { normalizeError } = useUtilStore()
const { showError } = useAppToast()

const props = defineProps<{
  fetchPage?: (
    page: number,
    limit: number,
    search: string,
  ) => Promise<{
    dados: TRow[]
    pagination: { total: number }
  }>
  items?: TRow[]
  tableMinWidth?: string
  emptyMessage?: string
  isActionVisible?: (action: string, row: TRow) => boolean
  isActionDisabled?: (action: string, row: TRow) => boolean
  dataKey: string
  columns: { field: string; header: string; minWidth?: string; align?: string }[]
  actions?: { action: string; label: string; icon: string; severity?: string }[]
  actionHeader?: string
  pageSize?: number
}>()

defineSlots<{
  groupheader?: (props: { data: TRow }) => unknown
  [name: `cell-${string}`]: (props: { data: TRow }) => unknown
}>()

const emit = defineEmits<{
  action: [event: { action: string; data: TRow }]
}>()

const rows = shallowRef<TRow[]>([])
const page = ref(1)
const limit = ref(props.pageSize ?? 20)
const total = ref(0)
const loading = ref(false)
const first = computed(() => (page.value - 1) * limit.value)
let search = ''
let requestId = 0

async function loadGrid(query?: string) {
  if (!props.fetchPage) return

  if (query !== undefined) {
    search = query
    page.value = 1
  }

  const currentRequest = ++requestId
  loading.value = true

  try {
    const result = await props.fetchPage(page.value, limit.value, search)
    if (currentRequest !== requestId) return

    rows.value = result.dados
    total.value = result.pagination.total
  } catch (error) {
    if (currentRequest !== requestId) return

    rows.value = []
    total.value = 0
    page.value = 1

    showError(normalizeError(error))
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

function changePage(event: DataTablePageEvent) {
  page.value = event.page + 1
  limit.value = event.rows
  void loadGrid()
}

defineExpose({ loadGrid, loading, rows, total })
</script>

<template>
  <DataTable
    :value="items ?? rows"
    :loading="loading"
    :aria-busy="loading"
    :dataKey="dataKey"
    size="small"
    stripedRows
    scrollable
    :scrollHeight="fetchPage ? 'flex' : undefined"
    :tableStyle="{ minWidth: tableMinWidth ?? '50rem' }"
    :lazy="!!fetchPage"
    :paginator="!!fetchPage"
    :first="first"
    :rows="limit"
    :totalRecords="total"
    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
    currentPageReportTemplate="Total: {totalRecords}"
    @page="changePage"
  >
    <template #empty>
      <div v-if="!loading" class="text-center p-2">
        {{ emptyMessage ?? 'Nenhum registro encontrado.' }}
      </div>
    </template>

    <template v-if="$slots.groupheader" #groupheader="{ data }">
      <slot name="groupheader" :data="data" />
    </template>

    <Column v-if="actions?.length" :header="actionHeader ?? 'Ações'">
      <template #body="{ data }">
        <Button
          v-for="item in actions?.filter((item) => isActionVisible?.(item.action, data) ?? true)"
          :key="item.action"
          :icon="item.icon"
          :aria-label="item.label"
          :title="item.label"
          :severity="item.severity === 'danger' ? 'danger' : 'secondary'"
          :disabled="loading || isActionDisabled?.(item.action, data)"
          text
          rounded
          @click="emit('action', { action: item.action, data })"
        />
      </template>
    </Column>

    <Column
      v-for="column in columns"
      :key="column.field"
      :field="column.field"
      :header="column.header"
      :style="{ minWidth: column.minWidth }"
      :bodyStyle="{ textAlign: column.align }"
    >
      <template #body="{ data }">
        <slot :name="`cell-${column.field}`" :data="data">
          {{ data[column.field] }}
        </slot>
      </template>
    </Column>
  </DataTable>
</template>
