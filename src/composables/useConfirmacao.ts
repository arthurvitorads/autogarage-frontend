import { useConfirm } from 'primevue/useconfirm'

export function useConfirmacao() {
  const confirm = useConfirm()
  return () => new Promise<boolean>(resolve => {
    confirm.require({
      header: 'Confirmação',
      message: 'Deseja realizar o processo?',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      rejectProps: { severity: 'secondary' },
      accept: () => resolve(true),
      reject: () => resolve(false),
      onHide: () => resolve(false),
    })
  })
}
