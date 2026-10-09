export function somenteNumeros(valor: string): string {
  return valor.replace(/\D/g, '')
}

export function validarCPF(cpf: string): boolean {
  const numeros = somenteNumeros(cpf)

  if (numeros.length !== 11) {
    return false
  }

  if (/^(\d)\1{10}$/.test(numeros)) {
    return false
  }

  let soma = 0

  for (let i = 0; i < 9; i++) {
    soma += Number(numeros[i]) * (10 - i)
  }

  let primeiroDigito = 11 - (soma % 11)

  if (primeiroDigito >= 10) {
    primeiroDigito = 0
  }

  if (primeiroDigito !== Number(numeros[9])) {
    return false
  }

  soma = 0

  for (let i = 0; i < 10; i++) {
    soma += Number(numeros[i]) * (11 - i)
  }

  let segundoDigito = 11 - (soma % 11)

  if (segundoDigito >= 10) {
    segundoDigito = 0
  }

  return segundoDigito === Number(numeros[10])
}



function normalizarCNPJ(cnpj: string): string {
  return cnpj
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function valorCaractereCNPJ(caractere: string): number {
  return caractere.charCodeAt(0) - 48
}

function calcularDigitoCNPJ(
  caracteres: string,
  pesos: number[],
): number {
  let soma = 0

  for (let i = 0; i < caracteres.length; i++) {
    soma +=
      valorCaractereCNPJ(caracteres[i]) *
      pesos[i]
  }

  const resto = soma % 11

  return resto < 2
    ? 0
    : 11 - resto
}

export function validarCNPJ(cnpj: string): boolean {
  const valor = normalizarCNPJ(cnpj)

  if (!/^[A-Z0-9]{12}[0-9]{2}$/.test(valor)) {
    return false
  }

  const base = valor.substring(0, 12)

  const primeiroDigito = calcularDigitoCNPJ(
    base,
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  )

  const segundoDigito = calcularDigitoCNPJ(
    base + primeiroDigito,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  )

  const digitosInformados = valor.slice(12)

  return digitosInformados ===
    `${primeiroDigito}${segundoDigito}`
}