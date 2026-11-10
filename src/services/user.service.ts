import { useUtilStore } from '@/stores/util.store'
import { apiPage, apiRequest } from '@/services/api.service'

import type { IMeUser } from '@/interface/interface-pages/LoginPage'
import type { IAdmUsuario, IFormUser, IUpdateUser } from '@/interface/interface-pages/UsuarioPage'

export function updateUser(id: string | number, values: IUpdateUser) {
  return apiRequest<IAdmUsuario>('/usuarios/atualizar', {
    cn_usuario: String(id),
    an_nome: values.an_nome.trim(),
    cn_perfil: values.cn_perfil ?? null,
    bo_sts_reg: values.bo_sts_reg,
  })
}

export function createUser(values: IFormUser) {
  return apiRequest<IAdmUsuario>('/usuarios', {
    an_nome: values.an_nome.trim(),
    an_email: values.an_email.trim().toLowerCase(),
    ca_senha: values.ca_senha,
    cn_perfil: values.cn_perfil ?? null,
    bo_sts_reg: values.bo_sts_reg,
  })
}

export async function getInitialMe(): Promise<IMeUser> {
  const { dados: user } = await apiRequest<IMeUser>('/auth/me')
  if (!user?.cn_usuario) throw new Error('Sessão inválida.')

  const utilStore = useUtilStore()
  utilStore.setUser(user)
  return user
}

export function getUsers(page = 1, limit = 20, search = '') {
  return apiPage<IAdmUsuario>('/usuarios/listar', page, limit, search)
}
