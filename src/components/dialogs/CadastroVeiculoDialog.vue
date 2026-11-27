<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import FieldForm from '@/components/field/FieldForm.vue'
import FormPage from '@/components/pages/FormPage.vue'
import config from '@/config/OrdemServicoPageConfig.json'
import { useConfirmacao } from '@/composables/useConfirmacao'
import type { IMarcaVeiculo } from '@/interface/pages/OrdemServicoPage'
import type { IFormPageRef } from '@/interface/util'
import { gravarMarcaVeiculo, gravarModeloVeiculo } from '@/services/ordem-api.service'
import { useAppToast } from '@/services/toast.service'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'
import { useUtilStore } from '@/stores/util.store'

interface IRegistroVeiculo {
  codigo: number
  cn_marca_veiculo: number
  an_descr: string
  an_marca: string
}

interface IFormCadastroVeiculo {
  cn_marca_veiculo: number | null
  an_descr: string
}

const props = defineProps<{
  visible: boolean
  tipo: 'marca' | 'modelo'
  marcaInicial?: number
}>()
const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [catalogo: IMarcaVeiculo[], registro: IRegistroVeiculo]
}>()
const { canWrite, normalizeError, setLoading } = useUtilStore()
const { showError, showSuccess } = useAppToast()
const confirmar = useConfirmacao()
const ordemStore = useOrdemServicoStore()
const { catalogoVeiculos: catalogo } = storeToRefs(ordemStore)
const codigo = ref<number | null>(null)
const formData = ref<IFormCadastroVeiculo>({ cn_marca_veiculo: null, an_descr: '' })
const formRef = ref<IFormPageRef | null>(null)
const formKey = ref(0)
const carregando = ref(false)
const gravando = ref(false)
const cadastroModelo = computed(() => props.tipo === 'modelo')
const registros = computed<IRegistroVeiculo[]>(() =>
  catalogo.value.flatMap((marca) =>
    cadastroModelo.value
      ? marca.modelos.map((modelo) => ({
          codigo: modelo.cn_modelo_veiculo,
          cn_marca_veiculo: marca.cn_marca_veiculo,
          an_descr: modelo.an_descr,
          an_marca: marca.an_marca,
        }))
      : [
          {
            codigo: marca.cn_marca_veiculo,
            cn_marca_veiculo: marca.cn_marca_veiculo,
            an_descr: marca.an_marca,
            an_marca: marca.an_marca,
          },
        ],
  ),
)

function selecionarRegistro(registro?: IRegistroVeiculo) {
  codigo.value = registro?.codigo ?? null
  formData.value = {
    cn_marca_veiculo: registro?.cn_marca_veiculo ?? props.marcaInicial ?? null,
    an_descr: registro?.an_descr ?? '',
  }
  formKey.value++
}

async function gravar(values: IFormCadastroVeiculo) {
  if (gravando.value || carregando.value || !(await confirmar())) return
  const an_descr = values.an_descr.trim()
  const cn_marca_veiculo = values.cn_marca_veiculo
  gravando.value = true
  setLoading(true)
  try {
    if (cadastroModelo.value) {
      if (cn_marca_veiculo === null) return
      const { dados } = await gravarModeloVeiculo({
        cn_modelo_veiculo: codigo.value ?? undefined,
        cn_marca_veiculo,
        an_descr,
      })
      codigo.value = dados.cn_modelo_veiculo
    } else {
      const { dados } = await gravarMarcaVeiculo({
        cn_marca_veiculo: codigo.value ?? undefined,
        an_descr,
      })
      codigo.value = dados.cn_marca_veiculo
    }

    await ordemStore.carregarCatalogoVeiculos()
    const registro = registros.value.find((item) => item.codigo === codigo.value)
    if (registro) {
      selecionarRegistro(registro)
      emit('saved', catalogo.value, registro)
    }
    showSuccess('Processo realizado com sucesso.')
  } catch (error) {
    showError(normalizeError(error))
  } finally {
    gravando.value = false
    setLoading(false)
  }
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return
    selecionarRegistro()
    carregando.value = true
    try {
      await ordemStore.carregarCatalogoVeiculos()
    } catch (error) {
      showError(normalizeError(error))
    } finally {
      carregando.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <Dialog
    :visible="visible"
    :header="cadastroModelo ? 'Modelos de veículos' : 'Marcas de veículos'"
    modal
    contentClass="flex min-h-0 flex-1 flex-col"
    :contentStyle="{ scrollbarWidth: 'none' }"
    :style="{ width: '48rem', height: '34rem', maxWidth: '95vw', maxHeight: '90vh' }"
    @update:visible="emit('update:visible', $event)"
  >
    <FormPage
      v-if="canWrite('CADASTROS')"
      ref="formRef"
      :key="formKey"
      class="shrink-0"
      novalidate
      :initialValues="formData"
      :modelValues="formData"
      :fields="cadastroModelo ? config.modeloVeiculoFields : config.marcaVeiculoFields"
      @submit="gravar"
    >
      <div class="grid grid-cols-12 gap-2 rounded-md border border-surface-200 p-5">
        <FloatLabel variant="on" class="col-span-12 sm:col-span-2">
          <InputText
            :id="'veiculo-codigo-' + tipo"
            :modelValue="codigo === null ? '' : String(codigo)"
            readonly
            fluid
            @keydown.delete.prevent="selecionarRegistro()"
            @keydown.backspace.prevent="selecionarRegistro()"
          />
          <label :for="'veiculo-codigo-' + tipo">Código</label>
        </FloatLabel>
        <FieldForm
          v-if="cadastroModelo"
          name="cn_marca_veiculo"
          compact
          class="col-span-12 sm:col-span-4 min-w-0"
          v-slot="{ invalid }"
        >
          <FloatLabel variant="on">
            <Select
              inputId="modelo-veiculo-marca"
              v-model="formData.cn_marca_veiculo"
              :options="catalogo"
              optionLabel="an_marca"
              optionValue="cn_marca_veiculo"
              :invalid="invalid"
              filter
              fluid
            />
            <label for="modelo-veiculo-marca">Marca</label>
          </FloatLabel>
        </FieldForm>
        <FieldForm
          name="an_descr"
          compact
          class="col-span-12 min-w-0"
          :class="cadastroModelo ? 'sm:col-span-6' : 'sm:col-span-10'"
          v-slot="{ invalid }"
        >
          <FloatLabel variant="on">
            <InputText
              :id="'veiculo-descricao-' + tipo"
              v-model="formData.an_descr"
              maxlength="4000"
              :invalid="invalid"
              fluid
            />
            <label :for="'veiculo-descricao-' + tipo">Descrição</label>
          </FloatLabel>
        </FieldForm>
      </div>
    </FormPage>
    <DataTable
      :value="registros"
      :loading="carregando"
      dataKey="codigo"
      size="small"
      scrollable
      scrollHeight="flex"
      class="mt-4 min-h-24 flex-1"
    >
      <Column v-if="canWrite('CADASTROS')" header="Ações">
        <template #body="{ data }">
          <Button
            icon="pi pi-pencil"
            severity="secondary"
            text
            aria-label="Editar"
            @click="selecionarRegistro(data)"
          />
        </template>
      </Column>
      <Column field="codigo" header="Código" style="width: 72px" bodyStyle="text-align: right" />
      <Column v-if="cadastroModelo" field="an_marca" header="Marca" />
      <Column field="an_descr" header="Descrição" />
    </DataTable>
    <template #footer>
      <div class="flex w-full justify-end gap-2 border-t border-surface-200 pt-4">
        <Button
          label="Fechar"
          severity="secondary"
          :disabled="gravando"
          @click="emit('update:visible', false)"
        />
        <Button
          v-if="canWrite('CADASTROS')"
          label="Gravar"
          :disabled="carregando || gravando"
          @click="formRef?.submit()"
        />
      </div>
    </template>
  </Dialog>
</template>
