<script setup lang="ts">
import { ref, watch } from 'vue'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import OrdemEvidencias from '@/components/pages/OrdemEvidencias.vue'
import type { IServiceOrderEvidence, TServiceOrderCode } from '@/interface/pages/OrdemServicoPage'
import { getOrderEvidences } from '@/services/ordem-api.service'
import { useUtilStore } from '@/stores/util.store'

const props = withDefaults(defineProps<{ orderId: TServiceOrderCode; visible?: boolean }>(), {
  visible: true,
})
const { normalizeError } = useUtilStore()
const activeTab = ref('observacoes')
const images = ref<IServiceOrderEvidence[]>([])
const loading = ref(false)
const error = ref('')

watch(
  [activeTab, () => props.orderId, () => props.visible],
  async ([tab, id, visible], _, onCleanup) => {
    images.value = []
    error.value = ''
    loading.value = false
    if (tab !== 'evidencias' || visible === false) return

    let current = true
    onCleanup(() => {
      current = false
    })
    loading.value = true
    try {
      const { dados } = await getOrderEvidences(id)
      if (current) images.value = dados
    } catch (failure) {
      if (current) error.value = normalizeError(failure)
    } finally {
      if (current) loading.value = false
    }
  },
)
</script>

<template>
  <Tabs v-model:value="activeTab">
    <TabList>
      <Tab value="observacoes">Observações</Tab>
      <Tab value="evidencias">Evidências</Tab>
    </TabList>
    <TabPanels>
      <TabPanel value="observacoes"><slot /></TabPanel>
      <TabPanel value="evidencias">
        <p v-if="loading">Carregando evidências...</p>
        <p v-else-if="error" role="alert">{{ error }}</p>
        <OrdemEvidencias v-else-if="images.length" :images="images" />
        <p v-else>Nenhuma evidência anexada.</p>
      </TabPanel>
    </TabPanels>
  </Tabs>
</template>
