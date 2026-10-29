<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import Fieldset from 'primevue/fieldset'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

import CadastroDialog from '@/components/dialogs/CadastroDialog.vue'
import FormPage from '@/components/pages/FormPage.vue'
import FieldForm from '@/components/field/FieldForm.vue'
import StatusOrdemServicoDialog from '@/components/dialogs/StatusOrdemServicoDialog.vue'

import type { IAdmOrdemServico, IFormOrdemServico, IManutOrdemServico, IStatusOrdemServico } from '@/interface/interface-pages/OrdemServicoPage'
import type { TGenericData } from '@/interface/util'

import { dataHoraLocal, normalizarPlaca, validarDadosOrdem } from '@/services/ordem-servico.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'
import { useOrdemServicoStore } from '@/stores/ordem-servico.store'

const props = defineProps<{
  visible: boolean
  ordem?: IAdmOrdemServico | null
}>()

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  saved: [ordem: IAdmOrdemServico]
}>()

const ordemStore = useOrdemServicoStore()
const { clientes, status, statusPadrao } = storeToRefs(ordemStore)
const { saveOrdem } = ordemStore
const { normalizeError, setLoading } = useUtilStore()
const toast = useAppToast()
const formErrors = ref<TGenericData>({})
const formKey = ref(0)
const formRef = ref<{
  submit: () => void
} | null>(null)
const statusVisible = ref(false)
const isEditing = computed(() => !!props.ordem)
const anoMaximo = new Date().getFullYear() + 1
const clientesOptions = computed(() => clientes.value.map(cliente => ({
  ...cliente,
  an_label: cliente.an_nome + ' — ' + cliente.an_documento,
})))

function formDataDefault(): IFormOrdemServico {
  return {
    cn_pessoa: null,
    cn_status: statusPadrao.value?.cn_status ?? null,
    dt_entrada: dataHoraLocal(),
    dt_previsao: '',
    an_responsavel: '',
    an_placa: '',
    an_marca: '',
    an_modelo: '',
    nu_ano: null,
    an_cor: '',
    qt_quilometragem: null,
    an_solicitacao: '',
    an_obs: '',
  }
}

const formData = ref<IFormOrdemServico>(formDataDefault())

function selectStatus(item: IStatusOrdemServico) {
  formData.value.cn_status = item.cn_status
  delete formErrors.value.cn_status
}

async function onSubmit(values: IFormOrdemServico) {
  const errors = validarDadosOrdem(values)

  if (!clientes.value.some(cliente => String(cliente.cn_pessoa) === String(values.cn_pessoa)))
    errors.cn_pessoa = 'Selecione um cliente ativo disponível.'

  if (!status.value.some(item => item.cn_status === values.cn_status))
    errors.cn_status = 'Selecione um status válido.'

  formErrors.value = errors
  if (Object.keys(errors).length)
    return

  setLoading(true)

  try {
    if (values.cn_pessoa === null || values.cn_status === null)
      return

    const dados: IManutOrdemServico = {
      ...(props.ordem ? { cn_ordem_servico: props.ordem.cn_ordem_servico } : {}),
      cn_pessoa: values.cn_pessoa,
      cn_status: values.cn_status,
      dt_entrada: new Date(values.dt_entrada).toISOString(),
      dt_previsao: values.dt_previsao ? new Date(values.dt_previsao).toISOString() : null,
      an_responsavel: values.an_responsavel.trim(),
      veiculo: {
        an_placa: normalizarPlaca(values.an_placa),
        an_marca: values.an_marca.trim(),
        an_modelo: values.an_modelo.trim(),
        nu_ano: values.nu_ano,
        an_cor: values.an_cor.trim(),
        qt_quilometragem: values.qt_quilometragem,
      },
      an_solicitacao: values.an_solicitacao.trim(),
      an_obs: values.an_obs.trim(),
    }
    const resultado = await saveOrdem(dados)
    emit('saved', resultado)
    toast.success('Processo realizado com sucesso.')
    emit('update:visible', false)
  } catch (error) {
    toast.error(normalizeError(error))
  } finally {
    setLoading(false)
  }
}

watch([() => props.visible, () => props.ordem], ([visible]) => {
  if (!visible)
    return

  const ordem = props.ordem

  formData.value = ordem ? {
    cn_pessoa: ordem.cn_pessoa,
    cn_status: ordem.cn_status,
    dt_entrada: dataHoraLocal(ordem.dt_entrada),
    dt_previsao: ordem.dt_previsao ? dataHoraLocal(ordem.dt_previsao) : '',
    an_responsavel: ordem.an_responsavel,
    ...ordem.veiculo,
    an_solicitacao: ordem.an_solicitacao,
    an_obs: ordem.an_obs,
  } : formDataDefault()
  formErrors.value = {}
  formKey.value++
}, { immediate: true })
</script>

<template>
  <CadastroDialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEditing ? 'Editar ordem de serviço' : 'Nova ordem de serviço'"
    width="96rem"
    @submit="formRef?.submit()"
  >
    <FormPage
      ref="formRef"
      :key="formKey"
      novalidate
      class="flex flex-col gap-4"
      v-model:errors="formErrors"
      :initialValues="formData"
      @submit="onSubmit(formData)"
    >
      <Fieldset legend="Dados gerais">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="col-span-12 sm:col-span-3" name="nu_numero" label="Número">
            <InputText :modelValue="ordem ? String(ordem.nu_numero).padStart(6, '0') : 'Automático'" readonly fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-6" name="cn_pessoa" label="Cliente *" v-slot="{ invalid, field }">
            <Select
              v-model="formData.cn_pessoa"
              :name="field"
              :options="clientesOptions"
              optionLabel="an_label"
              optionValue="cn_pessoa"
              placeholder="Selecione o cliente PF ou PJ"
              :invalid="invalid"
              filter
              fluid
              emptyMessage="Nenhum cliente disponível."
              emptyFilterMessage="Nenhum cliente corresponde à pesquisa."
            />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-3" name="cn_status" label="Status *" v-slot="{ invalid, field }">
            <div class="flex gap-2">
              <Select
                v-model="formData.cn_status"
                :name="field"
                :options="status"
                optionLabel="an_descr"
                optionValue="cn_status"
                :invalid="invalid"
                fluid
                class="flex-1 min-w-0"
                placeholder="Selecione o status"
              />
              <Button type="button" icon="pi pi-plus" aria-label="Cadastrar status" @click="statusVisible = true" />
            </div>
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="dt_entrada" label="Entrada *" v-slot="{ invalid, field }">
            <InputText
              v-model="formData.dt_entrada"
              :name="field"
              type="datetime-local"
              :invalid="invalid"
              fluid
            />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="dt_previsao" label="Previsão de entrega" v-slot="{ invalid, field }">
            <InputText
              v-model="formData.dt_previsao"
              :name="field"
              type="datetime-local"
              :invalid="invalid"
              fluid
            />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="an_responsavel" label="Responsável" v-slot="{ field }">
            <InputText v-model="formData.an_responsavel" :name="field" fluid />
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset legend="Dados do veículo">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="col-span-12 sm:col-span-3" name="an_placa" label="Placa *" v-slot="{ invalid, field }">
            <InputText
              v-model="formData.an_placa"
              :name="field"
              :invalid="invalid"
              maxlength="8"
              fluid
              @update:modelValue="formData.an_placa = ($event ?? '').toUpperCase()"
            />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="an_marca" label="Marca *" v-slot="{ invalid, field }">
            <InputText v-model="formData.an_marca" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-5" name="an_modelo" label="Modelo *" v-slot="{ invalid, field }">
            <InputText v-model="formData.an_modelo" :name="field" :invalid="invalid" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="nu_ano" label="Ano" v-slot="{ invalid, field }">
            <InputNumber
              v-model="formData.nu_ano"
              :name="field"
              :invalid="invalid"
              :min="1900"
              :max="anoMaximo"
              :useGrouping="false"
              fluid
            />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="an_cor" label="Cor" v-slot="{ field }">
            <InputText v-model="formData.an_cor" :name="field" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-4" name="qt_quilometragem" label="Quilometragem" v-slot="{ invalid, field }">
            <InputNumber
              v-model="formData.qt_quilometragem"
              :name="field"
              :invalid="invalid"
              :min="0"
              :max="9999999"
              locale="pt-BR"
              fluid
            />
          </FieldForm>
        </div>
      </Fieldset>
      <Fieldset legend="Observações">
        <div class="grid grid-cols-12 gap-x-4">
          <FieldForm class="col-span-12 sm:col-span-6" name="an_solicitacao" label="Solicitação do cliente" v-slot="{ field }">
            <Textarea v-model="formData.an_solicitacao" :name="field" rows="2" fluid />
          </FieldForm>
          <FieldForm class="col-span-12 sm:col-span-6" name="an_obs" label="Observações internas" v-slot="{ field }">
            <Textarea v-model="formData.an_obs" :name="field" rows="2" fluid />
          </FieldForm>
        </div>
      </Fieldset>
    </FormPage>
  </CadastroDialog>
  <StatusOrdemServicoDialog v-model:visible="statusVisible" @saved="selectStatus" />
</template>
