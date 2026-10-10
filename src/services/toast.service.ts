import { useToast } from 'primevue/usetoast'

export function useAppToast() {
  const toast = useToast()

  function success(message: string, summary = 'Sucesso') {
    toast.add({
      severity: 'success',
      summary,
      detail: message,
      life: 3000,
    })
  }

  function error(message: string, summary = 'Erro') {
    toast.add({
      severity: 'error',
      summary,
      detail: message,
      life: 5000,
    })
  }

  function warn(message: string, summary = 'Atenção') {
    toast.add({
      severity: 'warn',
      summary,
      detail: message,
      life: 4000,
    })
  }

  function info(message: string, summary = 'Informação') {
    toast.add({
      severity: 'info',
      summary,
      detail: message,
      life: 3000,
    })
  }

  return {
    success,
    error,
    warn,
    info,
  }
}