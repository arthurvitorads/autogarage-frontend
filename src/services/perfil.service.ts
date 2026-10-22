import { auth } from "./firebase.service"

import { IFormPerfil, IManutPerfilResponse, IPerfilResponse } from "@/interface/interface-pages/PerfilPage"

import { API_URL } from "@/constants/utils"

export async function getPerfil(
  ePage: number = 1,
  eLimit: number = 20,
  search: string = ''
): Promise<IPerfilResponse> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Usuário não autenticado.')
  }

  const token = await user.getIdToken()

  const params = new URLSearchParams({
    page: String(ePage),
    limit: String(eLimit),
    search,
  })

  const response = await fetch(
    `${API_URL}/perfil?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    if(response.status === 429) 
      throw new Error('Muitas requisições foram registradas. Aguarde alguns instantes!')

    throw new Error('Erro ao carregar perfil.')
  }

  return (await response.json()) as IPerfilResponse
}

export async function updatePerfil(id: string | number, values: IFormPerfil): Promise<IManutPerfilResponse> {
  const user = auth.currentUser

  if (!user) 
    throw new Error('Usuário não autenticado no Firebase.')
  
  const token = await user.getIdToken()
  
  const response = await fetch(`${API_URL}/perfil/${encodeURIComponent(String(id))}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      an_descr: values.an_descr.trim(), 
      bo_sts_reg: values.bo_sts_reg 
    }),
  })
  
  const result = await response.json()
  
  if (!response.ok) 
    throw new Error(result.erro || 'Erro ao atualizar perfil.')
  
    return result as IManutPerfilResponse
}

export async function createPerfil(values: IFormPerfil): Promise<IManutPerfilResponse> {
  const user = auth.currentUser

  if (!user) 
    throw new Error('Usuário não autenticado no Firebase.')

  const token = await user.getIdToken()

  const response = await fetch(`${API_URL}/perfil`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      an_descr: values.an_descr.trim(),
      bo_sts_reg: values.bo_sts_reg,
    }),
  })

  const result = await response.json()

  if (!response.ok) 
    throw new Error(result.erro || 'Erro ao criar perfil.')

  return result as IManutPerfilResponse
}