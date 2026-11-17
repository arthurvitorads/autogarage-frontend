import type { TGenericData } from '@/interface/util'

interface IFormFieldRules {
  required?: boolean
  requiredWhen?: Record<string, string | number | boolean | null>
}

export type TFormFields = Partial<Record<string, IFormFieldRules>>

export function isRequiredField(
  rule: IFormFieldRules | undefined,
  values: Record<string, unknown>,
) {
  if (rule?.required) return true
  if (!rule?.requiredWhen) return false

  const conditions = Object.entries(rule.requiredWhen)
  return conditions.length > 0 && conditions.every(([field, value]) => values[field] === value)
}

export function validateRequiredFields(fields: TFormFields, values: Record<string, unknown>) {
  const errors: TGenericData = {}

  for (const [field, rule] of Object.entries(fields)) {
    if (!isRequiredField(rule, values)) continue

    const value = values[field]
    if (
      value == null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)
    )
      errors[field] = 'Campo obrigatório.'
  }

  return errors
}
