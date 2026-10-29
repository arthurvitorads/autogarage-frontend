import { auth } from "./firebase.service"

import { API_URL } from "@/constants/utils"

import { IPessoaResponse } from "@/interface/interface-pages/PessoaPage"

export async function getPerson(
  ePage: number = 1,
  eLimit: number = 20,
  search: string = ''
): Promise<IPessoaResponse> {
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
    `${API_URL}/pessoa?${params}`,
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

  return (await response.json())
}