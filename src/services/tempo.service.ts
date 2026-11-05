export function formatTempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos))
  return (
    String(Math.floor(total / 3600)).padStart(2, '0') +
    ':' +
    String(Math.floor((total % 3600) / 60)).padStart(2, '0') +
    ':' +
    String(total % 60).padStart(2, '0')
  )
}
