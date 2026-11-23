<script setup lang="ts">
import type { IProfileAccessDialogProps } from '@/interface/pages/PerfilPage'
import { computed, reactive, ref, watch } from 'vue'
import type { IFormPageRef, TGenericData } from '@/interface/util'
import type { TFormFields } from '@/services/form-validation.service'
import FieldForm from '@/components/field/FieldForm.vue'
import FormPage from '@/components/pages/FormPage.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import { accessModules, type TModuleAccess } from '@/interface/access'
import { getProfileAccess, saveProfileAccess } from '@/services/perfil.service'
import { useAppToast } from '@/services/toast.service'
import { useUtilStore } from '@/stores/util.store'

const props = defineProps<IProfileAccessDialogProps>()
const emit = defineEmits<{ 'update:visible': [visible: boolean] }>()
const utilStore = useUtilStore()
const { showSuccess, showError } = useAppToast()
function formDataDefault(): TModuleAccess {
  return {
    GERAL: 3,
    CADASTROS: 3,
    ORDEM_SERVICO: 3,
    FATURAMENTO: 3,
    RELATORIOS: 3,
    ADMINISTRACAO: 3,
  }
}

const formData = reactive<TModuleAccess>(formDataDefault())
const formRef = ref<IFormPageRef | null>(null)
const formErrors = ref<TGenericData>({})
const fields: TFormFields = Object.fromEntries(
  accessModules.map(({ key }) => [key, { required: true }]),
)
const loaded = ref(false)
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const levels = [
  { value: 1, label: '1 - Total' },
  { value: 2, label: '2 - Consulta' },
  { value: 3, label: '3 - Sem acesso' },
]
const isOwnProfile = computed(() => utilStore.user?.cn_perfil === String(props.profile?.cn_perfil))
let requestId = 0

async function load() {
  const current = ++requestId
  const id = props.profile?.cn_perfil
  Object.assign(formData, formDataDefault())
  formErrors.value = {}
  loaded.value = false
  loadError.value = ''
  loading.value = props.visible && id != null
  if (!props.visible || id == null) return

  try {
    const { dados } = await getProfileAccess(id)
    if (current === requestId) {
      Object.assign(formData, dados)
      loaded.value = true
    }
  } catch (error) {
    if (current === requestId) loadError.value = utilStore.normalizeError(error)
  } finally {
    if (current === requestId) loading.value = false
  }
}

async function save(values: TModuleAccess) {
  const id = props.profile?.cn_perfil
  if (id == null || !loaded.value || saving.value || !utilStore.canWrite('ADMINISTRACAO')) return

  saving.value = true
  try {
    const { dados } = await saveProfileAccess(id, values)
    const user = utilStore.user
    if (user && user.cn_perfil === String(id)) utilStore.setUser({ ...user, acessos: dados })
    showSuccess('Processo realizado com sucesso.')
    emit('update:visible', false)
  } catch (error) {
    showError(utilStore.normalizeError(error))
  } finally {
    saving.value = false
  }
}

watch([() => props.visible, () => props.profile?.cn_perfil], load, { immediate: true })
</script>

<template>
  <Dialog
    :visible="visible"
    header="Acessos do perfil"
    modal
    :style="{ width: '38rem', maxWidth: '95vw' }"
    :closable="!saving"
    :closeOnEscape="!saving"
    @update:visible="emit('update:visible', $event)"
  >
    <p class="font-semibold mb-4">{{ profile?.an_descr }}</p>
    <p v-if="loading">Carregando acessos...</p>
    <div v-else-if="loadError" class="flex flex-wrap items-center gap-3">
      <p role="alert">{{ loadError }}</p>
      <Button label="Tentar novamente" severity="secondary" @click="load" />
    </div>
    <FormPage
      v-else-if="loaded"
      ref="formRef"
      class="flex flex-col gap-3"
      :initialValues="formData"
      :modelValues="formData"
      :fields="fields"
      v-model:errors="formErrors"
      @submit="save"
    >
      <div
        v-for="module in accessModules"
        :key="module.key"
        class="grid items-center gap-1 sm:grid-cols-2"
      >
        <label :for="'acesso-' + module.key">{{ module.label }}</label>
        <FieldForm :name="module.key" v-slot="{ invalid, field }">
          <Select
            v-model="formData[module.key]"
            :inputId="'acesso-' + module.key"
            :options="levels"
            optionLabel="label"
            optionValue="value"
            :disabled="
              saving ||
              !utilStore.canWrite('ADMINISTRACAO') ||
              (isOwnProfile && module.key === 'ADMINISTRACAO')
            "
            fluid
            :name="field"
            :invalid="invalid"
          />
        </FieldForm>
      </div>
    </FormPage>
    <template #footer>
      <Button
        label="Fechar"
        severity="secondary"
        :disabled="saving"
        @click="emit('update:visible', false)"
      />
      <Button
        v-if="utilStore.canWrite('ADMINISTRACAO')"
        label="Gravar"
        :disabled="!loaded || loading"
        :loading="saving"
        @click="formRef?.submit()"
      />
    </template>
  </Dialog>
</template>
