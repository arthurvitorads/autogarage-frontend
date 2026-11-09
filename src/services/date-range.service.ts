export function currentMonthDates() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  return [new Date(year, month, 1), new Date(year, month + 1, 0)]
}

export function dateInterval(dates: (Date | null)[]) {
  if (!dates[0] || !dates[1]) return null
  const inicio = new Date(dates[0])
  const fim = new Date(dates[1])
  inicio.setHours(0, 0, 0, 0)
  fim.setHours(23, 59, 59, 999)
  if (inicio > fim) return null
  return { inicio: inicio.toISOString(), fim: fim.toISOString() }
}
