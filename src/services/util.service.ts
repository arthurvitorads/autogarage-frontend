/* Normalizar variavies */
export function normalizeString(value: undefined | string) {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function parseDate(value?: string) {
  if (!value) return undefined

  return new Date(value)
}

export function validateDate(value?: Date) {
  if (!value) return false

  return value instanceof Date && !isNaN(value.getTime())
}

export function normalizeDate(value?: Date | string | null) {
  if (!value) return undefined

  const date = value instanceof Date ? value : new Date(value)

  if (isNaN(date.getTime())) return undefined

  const isoDate = date.toISOString()

  return isoDate.split('.').shift()
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return '-'

  return new Date(date).toLocaleString('pt-BR')
}

export function delay(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

/* Baixar url */
function downloadURL(ref: string, name: string) {
  const link = document.createElement('a')

  link.href = ref
  link.download = name

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)
}

/* Baixar texto */
export function downloadText(content: string, type: string, name: string) {
  if (!content || !type || !name) return

  downloadURL(
    `data:text/${type};charset=utf-8,${encodeURIComponent('\uFEFF' + content)}`,
    `${name}.${type}`,
  )
}

/* Baixar blob */
export function downloadFile(name: string, file: Blob) {
  if (!name || !file) return

  const url = window.URL.createObjectURL(file)

  downloadURL(url, name)

  window.URL.revokeObjectURL(url)
}

/* Abrir base64 */
export async function openBase64(base64: string) {
  const response = await fetch(base64)

  const blob = await response.blob()

  const url = URL.createObjectURL(blob)

  window.open(url)
}

/* Converter arquivo para base64 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(reader.result as string)
    }

    reader.onerror = reject

    reader.readAsDataURL(file)
  })
}

/* Pega o tipo do arquivo pelo nome */


/* Validar CPF */
export function validateCPF(value: string) {
  value = value.replace(/[^\d]+/g, '') // Remove mask characters
  if (value.length !== 11 || !!value.match(/(\d)\1{10}/)) return false

  const cp = value.split('').map((el) => +el)

  for (let i = 0; i < 2; i++) {
    let sum = 0

    for (let j = 0; j < 9 + i; j++) {
      const num = cp[j] as number

      sum += num * (10 + i - j)
    }

    let digit = 11 - (sum % 11)

    if (digit > 9) digit = 0

    if (cp[9 + i] !== digit) return false
  }

  return true
}

/* Validar CNPJ */
export function validateCNPJ(value: string) {
  if (!value) return false

  const cleanValue = value.replace(/[^\w]/g, '').toUpperCase()

  if (!cleanValue) return false

  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(cleanValue)) return false

  if (/^(\w)\1+$/.test(cleanValue)) return false

  const cnpjRole = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  function getValue(char: string) {
    const value = Number(char)

    if (!isNaN(value)) return value

    return char.charCodeAt(0) - 48
  }

  let sum = 0

  for (let i = 0; i < 12; sum += getValue(cleanValue.charAt(i)) * (cnpjRole[++i] as number));

  let rest = sum % 11

  if (Number(cleanValue.charAt(12)) !== (rest < 2 ? 0 : 11 - rest)) return false

  sum = 0

  for (let i = 0; i <= 12; sum += getValue(cleanValue.charAt(i)) * (cnpjRole[i++] as number));

  rest = sum % 11

  if (Number(cleanValue.charAt(13)) !== (rest < 2 ? 0 : 11 - rest)) return false

  return true
}

export function maskCpf(value: string) {
  const docValue = value.replace(/[^\da-zA-Z]/g, '').toUpperCase()

  return docValue
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCnpj(value: string) {
  const docValue = value.replace(/[^\da-zA-Z]/g, '').toUpperCase()

  return docValue
    .slice(0, 14)
    .replace(/^([A-Z\d]{2})([A-Z\d])/, '$1.$2')
    .replace(/^([A-Z\d]{2})\.([A-Z\d]{3})([A-Z\d])/, '$1.$2.$3')
    .replace(/\.(\w{3})(\w)/, '.$1/$2')
    .replace(/(\w{4})(\w)/, '$1-$2')
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function unMaskDocument(document: string): string {
  return document.replace(/[^A-Za-z0-9]/g, '')
}

export function onlyNumbers(valor: string): string {
  return valor.replace(/\D/g, '')
}

export function maskTelefone(value: string) {
  const telefone = value.replace(/\D/g, '')
  if (telefone.length === 11)
    return telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  if (telefone.length === 10)
    return telefone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  return value
}
