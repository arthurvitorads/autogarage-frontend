import { useToast } from 'primevue/usetoast'

export function useAppToast() {
  const toast = useToast()

  function showSuccess(message: string, summary = 'Sucesso') {
    toast.add({
      severity: 'success',
      summary,
      detail: message,
      life: 3000,
    })
  }

  function showError(message: string, summary = 'Erro') {
    toast.add({
      severity: 'error',
      summary,
      detail: message,
      life: 5000,
    })
  }

  function showWarn(message: string, summary = 'Atenção') {
    toast.add({
      severity: 'warn',
      summary,
      detail: message,
      life: 4000,
    })
  }

  function showInfo(message: string, summary = 'Informação') {
    toast.add({
      severity: 'info',
      summary,
      detail: message,
      life: 3000,
    })
  }

  return {
    showSuccess,
    showError,
    showWarn,
    showInfo,
  }
}
