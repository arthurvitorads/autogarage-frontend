import { auth } from "./firebase.service"

import { IPerfilResponse } from "@/interface/interface-pages/PerfilPage"

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

