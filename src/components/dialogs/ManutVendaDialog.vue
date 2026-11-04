<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Fieldset from 'primevue/fieldset'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import CadastroDialog from '@/components/dialogs/CadastroDialog.vue'
import type { IAdmOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'
import type { ICadPessoa } from '@/interface/interface-pages/PessoaPage'
import type { IAdmVenda, IFormItemVenda, IManutItemVenda } from '@/interface/interface-pages/VendaPage'
import { useCatalogoStore } from '@/stores/catalogo.store'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'
import { useUtilStore } from '@/stores/util.store'
import { useAppToast } from '@/services/toast.service'
import { apiRequest } from '@/services/api.service'
import { createVenda } from '@/services/faturamento.service'
import { calcularTotalItemOrdem, formatCurrencyOrdem } from '@/services/ordem-servico.service'

const props = defineProps<{ visible: boolean; ordem?: IAdmOrdemServico | null }>()
const emit = defineEmits<{ 'update:visible': [visible: boolean]; saved: [venda: IAdmVenda] }>()
const catalogoStore = useCatalogoStore()
const ordemStore = useOrdemServicoStore()
const { produtos, servicos } = storeToRefs(catalogoStore)
const { clientes, ordens } = storeToRefs(ordemStore)
const { setLoading, normalizeError } = useUtilStore()
const toast = useAppToast()
const origem = ref('DIRETA')
const cnPessoa = ref<string | number | null>(null)
const cnOrdem = ref<string | number | null>(null)
const cliente = ref<ICadPessoa | null>(null)
const observacao = ref('')
const itens = ref<(IManutItemVenda & { an_descr: string; vl_total: number })[]>([])
const chave = ref('')
const saving = ref(false)
const carregando = ref(false)
const erroCarga = ref('')
const item = ref<IFormItemVenda>({ ca_tipo: 'PRODUTO', cn_referencia: null, qt_quantidade: 1, vl_unitario: 0 })
const opcoesOrigem = [{ label: 'Venda avulsa', value: 'DIRETA' }, { label: 'Por ordem de serviço', value: 'ORDEM_SERVICO' }]
const tipos = [{ label: 'Produto', value: 'PRODUTO' }, { label: 'Serviço', value: 'SERVICO' }]
const ordensDisponiveis = computed(() => ordens.value.filter(ordem => ordem.ca_status === 'FINALIZADO' && ordem.itens.length && !ordem.cn_venda)
  .map(ordem => ({ ...ordem, an_label: 'O.S. ' + ordem.nu_numero + ' — ' + ordem.an_cliente })))
const ordemSelecionada = computed(() => props.ordem ?? ordens.value.find(ordem => String(ordem.cn_ordem_servico) === String(cnOrdem.value)) ?? null)
const referencias = computed(() => item.value.ca_tipo === 'PRODUTO'
  ? produtos.value.filter(produto => produto.bo_sts_reg).map(produto => ({ cn_referencia: produto.cn_produto, an_nome: produto.an_nome, vl_preco: produto.vl_venda }))
  : servicos.value.filter(servico => servico.bo_sts_reg).map(servico => ({ cn_referencia: servico.cn_servico, an_nome: servico.an_nome, vl_preco: servico.vl_preco })))
const linhas = computed(() => origem.value === 'ORDEM_SERVICO' ? ordemSelecionada.value?.itens ?? [] : itens.value)
const total = computed(() => linhas.value.reduce((soma, linha) => soma + Math.round(linha.vl_total * 100), 0) / 100)
let consultaCliente = 0
watch(cnPessoa, async codigo => {
  const consulta = ++consultaCliente
  cliente.value = null
  if (!codigo) return
  try {
    const { dados } = await apiRequest<ICadPessoa>('/pessoa/' + encodeURIComponent(codigo))
    if (consulta === consultaCliente) cliente.value = dados
  } catch (error) {
    if (consulta === consultaCliente) toast.error(normalizeError(error))
  }
})
watch([origem, ordemSelecionada], () => {
  if (origem.value === 'ORDEM_SERVICO') cnPessoa.value = ordemSelecionada.value?.cn_pessoa ?? null
})
watch(origem, value => {
  if (value === 'DIRETA') cnPessoa.value = null
})
watch(() => [item.value.ca_tipo, item.value.cn_referencia], () => {
  item.value.vl_unitario = referencias.value.find(ref => ref.cn_referencia === item.value.cn_referencia)?.vl_preco ?? 0
})
watch(() => item.value.ca_tipo, () => { item.value.cn_referencia = null })

async function carregar() {
  carregando.value = true
  erroCarga.value = ''
  try {
    await ordemStore.load()
  } catch (error) {
    erroCarga.value = normalizeError(error)
  } finally {
    carregando.value = false
  }
}

watch(() => props.visible, async visible => {
  if (!visible) return
  chave.value = crypto.randomUUID()
  origem.value = props.ordem ? 'ORDEM_SERVICO' : 'DIRETA'
  cnOrdem.value = props.ordem?.cn_ordem_servico ?? null
  cnPessoa.value = props.ordem?.cn_pessoa ?? null
  observacao.value = ''
  itens.value = []
  item.value = { ca_tipo: 'PRODUTO', cn_referencia: null, qt_quantidade: 1, vl_unitario: 0 }
  await carregar()
})

function adicionar() {
  try {
    const referencia = referencias.value.find(ref => ref.cn_referencia === item.value.cn_referencia)
    if (!referencia) throw new Error('Selecione um item.')
    const vlTotal = calcularTotalItemOrdem(item.value.qt_quantidade!, item.value.vl_unitario!)
    itens.value.push({
      ca_tipo: item.value.ca_tipo, cn_produto: item.value.ca_tipo === 'PRODUTO' ? referencia.cn_referencia : null,
      cn_servico: item.value.ca_tipo === 'SERVICO' ? referencia.cn_referencia : null,
      qt_quantidade: item.value.qt_quantidade!, vl_unitario: item.value.vl_unitario!, an_descr: referencia.an_nome, vl_total: vlTotal,
    })
  } catch (error) {
    toast.error(normalizeError(error))
  }
}

async function gravar() {
  if (saving.value || carregando.value) return
  if (!cliente.value || !cnPessoa.value || !linhas.value.length) {
    toast.warn('Selecione o cliente e adicione pelo menos um item.')
    return
  }
  if (origem.value === 'ORDEM_SERVICO' && (!ordemSelecionada.value || ordemSelecionada.value.ca_status !== 'FINALIZADO')) {
    toast.warn('Selecione uma O.S. finalizada.')
    return
  }
  saving.value = true
  setLoading(true)
  try {
    const { dados } = await createVenda({
      cn_pessoa: cnPessoa.value, ca_chave_requisicao: chave.value, an_obs: observacao.value,
      ...(origem.value === 'ORDEM_SERVICO' ? { cn_ordem_servico: ordemSelecionada.value!.cn_ordem_servico }
        : { itens: itens.value.map(({ an_descr, vl_total, ...dados }) => dados) }),
    })
    toast.success('Venda registrada com sucesso.')
    emit('saved', dados)
    emit('update:visible', false)
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    saving.value = false
    setLoading(false)
  }
}
</script>

<template>
  <CadastroDialog :visible="visible" header="Registrar venda" width="82rem" :disabled="saving || carregando || !!erroCarga" @submit="gravar" @update:visible="emit('update:visible', $event)">
    <div class="flex flex-col gap-4">
      <p v-if="carregando">Carregando dados da venda...</p>
      <div v-if="erroCarga" role="alert" class="flex gap-3 items-center">
        <p>{{ erroCarga }}</p><Button label="Tentar novamente" severity="secondary" @click="carregar" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select v-model="origem" :options="opcoesOrigem" optionLabel="label" optionValue="value" :disabled="!!ordem || saving" aria-label="Origem da venda" />
        <Select v-if="origem === 'ORDEM_SERVICO' && !ordem" v-model="cnOrdem" :options="ordensDisponiveis" optionLabel="an_label"
          optionValue="cn_ordem_servico" placeholder="Selecione a O.S. finalizada" filter aria-label="Ordem de serviço" />
        <Select v-if="origem === 'DIRETA'" v-model="cnPessoa" :options="clientes" optionLabel="an_nome" optionValue="cn_pessoa"
          placeholder="Selecione o cliente" filter aria-label="Cliente da venda" />
      </div>
      <Fieldset legend="Cliente">
        <div v-if="cliente" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <p class="font-semibold">{{ cliente.an_nome || cliente.an_razao_social }}</p>
          <p>{{ cliente.ca_cpf || cliente.ca_cnpj }}</p><p>{{ cliente.an_email }}</p><p>{{ cliente.an_telefone }}</p>
          <p v-if="cliente.endereco" class="sm:col-span-2">{{ cliente.endereco.an_logradouro }}, {{ cliente.endereco.an_numero }} — {{ cliente.endereco.an_cidade }}/{{ cliente.endereco.ca_uf }}</p>
        </div>
        <p v-else>Selecione um cliente para conferir as informações.</p>
      </Fieldset>
      <Fieldset legend="Itens">
        <div v-if="origem === 'DIRETA'" class="flex flex-wrap gap-2 mb-4 items-end">
          <Select v-model="item.ca_tipo" :options="tipos" optionLabel="label" optionValue="value" aria-label="Tipo do item" />
          <Select v-model="item.cn_referencia" :options="referencias" optionLabel="an_nome" optionValue="cn_referencia" placeholder="Produto ou serviço" filter class="min-w-64" aria-label="Produto ou serviço" />
          <div><label class="block mb-1">Quantidade</label><InputNumber v-model="item.qt_quantidade" :min="0.001" :maxFractionDigits="3" class="w-32" aria-label="Quantidade" /></div>
          <div><label class="block mb-1">Preço unitário</label><InputNumber v-model="item.vl_unitario" :min="0" :max="999999999.99" mode="currency" currency="BRL" locale="pt-BR" class="w-40" aria-label="Preço unitário" /></div>
          <Button icon="pi pi-plus" label="Adicionar" @click="adicionar" />
        </div>
        <DataTable :value="linhas" size="small" scrollable tableStyle="min-width: 45rem">
          <Column field="an_descr" header="Descrição" /><Column field="ca_tipo" header="Tipo" /><Column field="qt_quantidade" header="Quantidade" />
          <Column header="Unitário"><template #body="{ data }">{{ formatCurrencyOrdem(data.vl_unitario) }}</template></Column>
          <Column header="Total"><template #body="{ data }">{{ formatCurrencyOrdem(data.vl_total) }}</template></Column>
          <Column v-if="origem === 'DIRETA'" header="Ações"><template #body="{ index }"><Button icon="pi pi-trash" text severity="danger" aria-label="Remover item" @click="itens.splice(index, 1)" /></template></Column>
          <template #empty>Nenhum item adicionado.</template>
        </DataTable>
        <p class="text-right font-bold mt-3">Total: {{ formatCurrencyOrdem(total) }}</p>
      </Fieldset>
      <label for="venda-observacao">Observações</label><Textarea id="venda-observacao" v-model="observacao" rows="2" fluid />
    </div>
  </CadastroDialog>
</template>
