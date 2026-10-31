<script setup lang="ts">
import { usePageLoad } from '@/composables/usePageLoad'
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import FiltroData from '@/components/field/FiltroData.vue'
import { filtroPeriodo, intervaloDatas } from '@/services/periodo.service'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'


const { ordens } = storeToRefs(useOrdemServicoStore())
const ultimoMes = filtroPeriodo('trinta-dias')
const datas = ref<(Date | null)[]>([new Date(ultimoMes.inicio), new Date(ultimoMes.fim)])
const intervalo = computed(() => intervaloDatas(datas.value))


const ordensPeriodo = computed(() => {
  if (!intervalo.value)
    return []
  const inicio = new Date(intervalo.value.inicio)
  const fim = new Date(intervalo.value.fim)
  return ordens.value.filter(ordem => {
    const entrada = new Date(ordem.dt_entrada).getTime()
    return entrada >= inicio.getTime() && entrada <= fim.getTime()
  })
})
const indicadores = computed(() => [
  { status: 'ABERTO', titulo: 'O.S. abertas', legenda: 'Aguardando início', icone: 'pi-folder-open', cor: 'blue' },
  { status: 'EM_ANDAMENTO', titulo: 'O.S. em andamento', legenda: 'Serviços em execução', icone: 'pi-wrench', cor: 'purple' },
  { status: 'FINALIZADO', titulo: 'O.S. finalizadas', legenda: 'Serviços concluídos', icone: 'pi-check-circle', cor: 'green' },
  { status: 'CANCELADO', titulo: 'O.S. canceladas', legenda: 'Ordens canceladas', icone: 'pi-ban', cor: 'slate' },
].map(item => ({ ...item, valor: ordensPeriodo.value.filter(ordem => ordem.ca_status === item.status).length })))

const atalhos = [
  {
    titulo: 'Painel de O.S.',
    descricao: 'Acompanhe os serviços da oficina',
    icone: 'pi-th-large',
    rota: 'ordem-servico-painel'
  },
  {
    titulo: 'Pessoas',
    descricao: 'Consulte clientes e fornecedores',
    icone: 'pi-users',
    rota: 'pessoa'
  },
  {
    titulo: 'Produtos',
    descricao: 'Acesse o catálogo de produtos',
    icone: 'pi-box',
    rota: 'produto'
  },
  {
    titulo: 'Serviços',
    descricao: 'Consulte os serviços disponíveis',
    icone: 'pi-wrench',
    rota: 'servico'
  },
]
usePageLoad(() => useOrdemServicoStore().load())
</script>

<template>
  <div class="dashboard">
    <section aria-labelledby="resumo-titulo">
      <div class="section-heading">
        <div>
          <h2 id="resumo-titulo">Visão geral da oficina</h2>
          <p>O.S. por data de entrada no período selecionado.</p>
        </div>
        <FiltroData v-model="datas" />
      </div>
      <div class="indicators">
        <RouterLink :to="{ name: 'ordem-servico-painel', query: { ...intervalo, status: indicador.status } }" v-for="indicador in indicadores" :key="indicador.titulo" class="indicator" :class="indicador.cor">
          <div class="indicator-heading">
            <h3>{{ indicador.titulo }}</h3>
            <span class="indicator-icon">
              <i class="pi" :class="indicador.icone" aria-hidden="true"></i>
            </span>
          </div>
          <strong class="indicator-value">{{ indicador.valor }}</strong>
          <p>{{ indicador.legenda }}</p>
        </RouterLink>
      </div>
    </section>
    <section class="shortcuts-container" aria-labelledby="atalhos-titulo">
      <div class="section-heading">
        <div>
          <h2 id="atalhos-titulo">Atalhos</h2>
        </div>
      </div>
      <div class="shortcuts">
        <RouterLink v-for="atalho in atalhos" :key="atalho.rota" :to="{ name: atalho.rota }" class="shortcut">
          <span class="shortcut-icon">
            <i class="pi" :class="atalho.icone" aria-hidden="true"></i>
          </span>
          <div>
            <h3>{{ atalho.titulo }}</h3>
            <p>{{ atalho.descricao }}</p>
          </div>
          <i class="pi pi-angle-right shortcut-arrow" aria-hidden="true"></i>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 28px; }
.section-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
h2 { margin: 0; font-size: 1.45rem; font-weight: 600; color: var(--p-text-color); }
p { margin: 6px 0 0; color: var(--p-text-muted-color); line-height: 1.5; }
.period-filter { display: flex; align-items: center; gap: 10px; }
.period-filter label { color: var(--p-text-muted-color); font-weight: 600; }
.period-select { min-width: 190px; }
.total { padding: 8px 12px; border-radius: 8px; background: var(--p-surface-100); color: var(--p-text-muted-color); font-weight: 600; }
.indicators { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.indicator { text-decoration: none; color: inherit; border: 1px solid var(--p-surface-200); border-top: 3px solid var(--accent); border-radius: 12px; padding: 20px; background: var(--p-content-background); }
.indicator-heading { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
h3 { margin: 0; font-size: 1rem; font-weight: 600; }
.indicator-heading h3 { color: var(--p-text-muted-color); }
.indicator-icon, .shortcut-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; }
.indicator-icon { background: var(--tint); color: var(--accent); font-size: 1.2rem; }
.indicator-value { display: block; margin-top: 14px; font-size: 2.6rem; line-height: 1.2; font-weight: 700; font-variant-numeric: tabular-nums; }
.indicator p, .summary-note, .shortcut p { font-size: .9rem; }
.blue { --accent: #2563eb; --tint: #eff6ff; }
.purple { --accent: #a855f7; --tint: #faf5ff; }
.green { --accent: #15803d; --tint: #f0fdf4; }
.red { --accent: #dc2626; --tint: #fef2f2; }
.slate { --accent: #64748b; --tint: #f1f5f9; }
.summary-note { margin-top: 12px; }
.empty-state { display: flex; align-items: center; gap: 16px; padding: 20px; margin-top: 20px; border: 1px dashed var(--p-surface-300); border-radius: 12px; }
.empty-state > i { font-size: 1.8rem; color: var(--p-text-muted-color); }
.create-link { display: inline-flex; gap: 10px; align-items: center; margin-left: auto; color: var(--p-primary-700); font-weight: 600; text-decoration: none; white-space: nowrap; }
.shortcuts-container { border: 1px solid var(--p-surface-200); border-radius: 12px; padding: 24px; background: var(--p-content-background); }
.shortcuts { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; }
.shortcut { display: flex; align-items: center; gap: 12px; padding: 16px; border: 1px solid var(--p-surface-200); border-radius: 10px; text-decoration: none; color: var(--p-text-color); transition: background .15s, border-color .15s; }
.shortcut:hover { background: var(--p-primary-50); border-color: var(--p-primary-300); }
.shortcut-icon { color: var(--p-primary-700); background: var(--p-primary-50); font-size: 1.2rem; }
.shortcut-arrow { margin-left: auto; color: var(--p-text-muted-color); }
a:focus-visible { outline: 2px solid var(--p-primary-500); outline-offset: 4px; }
@media (max-width: 1200px) { .indicators { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 768px) { .indicators { grid-template-columns: repeat(2, minmax(0, 1fr)); } .empty-state { flex-wrap: wrap; } .create-link { margin-left: 0; } .shortcuts-container { padding: 18px; } }
@media (max-width: 480px) { .indicators, .shortcuts { grid-template-columns: 1fr; } }
</style>
