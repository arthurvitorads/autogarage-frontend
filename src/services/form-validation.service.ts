import type { TGenericData } from '@/interface/util'

import {
  validateCep,
  validateCNPJ,
  validateCPF,
  validateEmail,
  validateTel,
} from '@/services/util.service'

type TFieldConditions = Record<string, string | number | boolean | null>

interface IFormFieldRules {
  required?: boolean
  trim?: boolean
  requiredWhen?: TFieldConditions
  validators?: readonly string[]
  validateWhen?: TFieldConditions
}

export type TFormFields = Partial<Record<string, IFormFieldRules>>

interface IFormValidator {
  check: (value: string) => boolean
  message: string
}

const validators = new Map<string, IFormValidator>([
  [
    'senha',
    {
      check: (value: string) => value.length >= 6 && value.length <= 128,
      message: 'A senha deve conter entre 6 e 128 caracteres.',
    },
  ],
  [
    'sigla',
    {
      check: (value: string) => /^[A-Z0-9]{1,10}$/i.test(value),
      message: 'Informe uma sigla com até 10 letras ou números.',
    },
  ],
  ['cpf', { check: validateCPF, message: 'Informe um CPF válido.' }],
  ['cnpj', { check: validateCNPJ, message: 'Informe um CNPJ válido.' }],
  ['email', { check: validateEmail, message: 'Informe um e-mail válido.' }],
  ['cep', { check: validateCep, message: 'Informe um CEP válido.' }],
  ['telefone', { check: validateTel, message: 'Informe um telefone com DDD (10 ou 11 dígitos).' }],
])

function matchesConditions(conditions: TFieldConditions, values: Record<string, unknown>) {
  const entries = Object.entries(conditions)
  return entries.length > 0 && entries.every(([field, value]) => values[field] === value)
}

export function isRequiredField(
  rule: IFormFieldRules | undefined,
  values: Record<string, unknown>,
) {
  if (rule?.required) return true
  if (!rule?.requiredWhen) return false

  return matchesConditions(rule.requiredWhen, values)
}

export function validateFormField(
  field: string,
  rule: IFormFieldRules | undefined,
  values: Record<string, unknown>,
) {
  const rawValue = values[field]
  const value = typeof rawValue === 'string' && rule?.trim !== false ? rawValue.trim() : rawValue
  const empty =
    value == null ||
    (typeof value === 'string' && value === '') ||
    (Array.isArray(value) && value.length === 0)

  if (empty) return isRequiredField(rule, values) ? 'Campo obrigatório.' : undefined
  if (rule?.validateWhen && !matchesConditions(rule.validateWhen, values)) return

  for (const name of rule?.validators ?? []) {
    const validator = validators.get(name)
    if (!validator) throw new Error(`Validador de formulário desconhecido: ${name}`)
    if (typeof value !== 'string' || !validator.check(value)) return validator.message
  }
}

export function validateFormFields(fields: TFormFields, values: Record<string, unknown>) {
  const errors: TGenericData = {}

  for (const [field, rule] of Object.entries(fields)) {
    const error = validateFormField(field, rule, values)
    if (error) errors[field] = error
  }

  return errors
}
