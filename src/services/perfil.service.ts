import { apiPage, apiRequest } from '@/services/api.service'

import type { IAdmPerfil, IFormProfile } from '@/interface/interface-pages/PerfilPage'
import type { TModuleAccess } from '@/interface/access'

export function getProfileAccess(id: string | number) {
  return apiRequest<TModuleAccess>('/perfil/acessos/consultar', { cn_perfil: id })
}

export function saveProfileAccess(id: string | number, access: TModuleAccess) {
  return apiRequest<TModuleAccess>('/perfil/acessos/atualizar', {
    cn_perfil: id,
    acessos: access,
  })
}

export function getProfiles(page = 1, limit = 20, search = '') {
  return apiPage<IAdmPerfil>('/perfil/listar', page, limit, search)
}

export function updateProfile(id: string | number, values: IFormProfile) {
  return apiRequest<IAdmPerfil>('/perfil/atualizar', {
    cn_perfil: String(id),
    an_descr: values.an_descr.trim(),
    bo_sts_reg: values.bo_sts_reg,
  })
}

export function createProfile(values: IFormProfile) {
  return apiRequest<IAdmPerfil>('/perfil', {
    an_descr: values.an_descr.trim(),
    bo_sts_reg: values.bo_sts_reg,
  })
}
