<script setup lang="ts" generic="TRow extends object">
import { computed, ref, shallowRef, useId } from 'vue'
import DataTable, { type DataTablePageEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import type { MenuItem } from 'primevue/menuitem'
import { Tag } from 'primevue'

import { useAppToast } from '@/services/toast.service'
import { formatDateTime } from '@/services/util.service'

import { useUtilStore } from '@/stores/util.store'

defineOptions({ inheritAttrs: false })

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
  isActionVisible?: (action: string, row: TRow) => boolean
  isActionDisabled?: (action: string, row: TRow) => boolean
  dataKey: string
  columns: { field: string; header: string; width?: number; minWidth?: string; align?: string }[]
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
const actionMenu = ref<InstanceType<typeof Menu>>()
const actionMenuId = useId()
const menuItems = shallowRef<MenuItem[]>([])
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

function columnStyle(column: (typeof props.columns)[number]) {
  const width = column.width === undefined ? undefined : String(column.width) + 'px'
  return { width, minWidth: column.minWidth ?? width }
}

function visibleActions(row: TRow) {
  return (props.actions ?? []).filter(({ action }) => props.isActionVisible?.(action, row) ?? true)
}

function openActions(event: MouseEvent, row: TRow) {
  menuItems.value = visibleActions(row).map((item) => ({
    label: item.label,
    icon: item.icon,
    disabled: loading.value || (props.isActionDisabled?.(item.action, row) ?? false),
    class: item.severity === 'danger' ? 'text-red-600' : undefined,
    command: () => emit('action', { action: item.action, data: row }),
  }))
  actionMenu.value?.toggle(event)
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
    v-bind="$attrs"
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
    <template v-if="$slots.groupheader" #groupheader="{ data }">
      <slot name="groupheader" :data="data" />
    </template>

    <Column
      v-if="actions?.length"
      :header="actionHeader ?? 'Ações'"
      style="width: 5rem; min-width: 5rem"
    >
      <template #body="{ data }">
        <Button
          v-if="visibleActions(data).length"
          type="button"
          icon="pi pi-ellipsis-v"
          aria-label="Ações"
          aria-haspopup="menu"
          :aria-controls="actionMenuId"
          :disabled="loading"
          severity="secondary"
          text
          @click="openActions($event, data)"
        />
      </template>
    </Column>

    <Column
      v-for="column in columns"
      :key="column.field"
      :field="column.field"
      :header="column.header"
      :style="columnStyle(column)"
      :bodyStyle="{ textAlign: column.align }"
    >
      <template #body="{ data }">
        <slot :name="`cell-${column.field}`" :data="data">
          <span v-if="column.field === 'dt_inc' || column.field === 'dt_alt'">
            {{ formatDateTime(data[column.field]) }}
          </span>

          <span v-else-if="column.field === 'bo_sts_reg'">
            <Tag
              :value="data.bo_sts_reg ? 'Ativo' : 'Inativo'"
              :severity="data.bo_sts_reg ? 'success' : 'danger'"
            />
          </span>

          <span v-else>
            {{ data[column.field] }}
          </span>
        </slot>
      </template>
    </Column>
  </DataTable>
  <Menu v-if="actions?.length" :id="actionMenuId" ref="actionMenu" :model="menuItems" popup />
</template>
