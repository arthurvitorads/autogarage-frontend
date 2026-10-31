export const periodos = [
  { label: 'Mês atual', value: 'mes-atual' },
  { label: 'Hoje', value: 'hoje' },
  { label: 'Última semana', value: 'semana' },
  { label: 'Último mês', value: 'trinta-dias' },
  { label: 'Últimos 3 meses', value: 'tres-meses' },
  { label: 'Últimos 6 meses', value: 'seis-meses' },
]

export function filtroPeriodo(periodo: string, agora = Date.now()) {
  const inicio = new Date(agora)
  inicio.setHours(0, 0, 0, 0)
  if (periodo === 'mes-atual') {
    inicio.setDate(1)
    const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0, 23, 59, 59, 999)
    return { inicio: inicio.toISOString(), fim: fim.toISOString() }
  }
  if (periodo === 'semana')
    inicio.setDate(inicio.getDate() - 6)
  else if (periodo === 'trinta-dias')
    inicio.setDate(inicio.getDate() - 29)
  else if (periodo === 'tres-meses' || periodo === 'seis-meses') {
    const dia = inicio.getDate()
    inicio.setDate(1)
    inicio.setMonth(inicio.getMonth() - (periodo === 'tres-meses' ? 3 : 6))
    const ultimoDia = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0).getDate()
    inicio.setDate(Math.min(dia, ultimoDia))
  }
  return { inicio: inicio.toISOString(), fim: new Date(agora).toISOString() }
}

export function datasMesAtual() {
  const { inicio, fim } = filtroPeriodo('mes-atual')
  return [new Date(inicio), new Date(fim)]
}

export function intervaloDatas(datas: (Date | null)[]) {
  if (!datas[0] || !datas[1])
    return null
  const inicio = new Date(datas[0])
  const fim = new Date(datas[1])
  inicio.setHours(0, 0, 0, 0)
  fim.setHours(23, 59, 59, 999)
  if (inicio > fim)
    return null
  return { inicio: inicio.toISOString(), fim: fim.toISOString() }
}
