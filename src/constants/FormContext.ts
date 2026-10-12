import type { ComputedRef, InjectionKey } from 'vue'
import type { TGenericData } from '@/interface/util'

export const FORM_ERRORS_KEY: InjectionKey<ComputedRef<TGenericData>> = Symbol('form-errors')