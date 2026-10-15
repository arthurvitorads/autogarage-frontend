import { auth } from "./firebase.service"

import { useUtilStore } from "@/stores/util.store"
import { handleFirstLogin } from "./auth.service"

import { IMeResponse, IMeUser } from "@/interface/interface-pages/LoginPage"

import { IUsuarioResponse } from "@/interface/interface-pages/UsuarioPage"

import { API_URL, TOKEN_KEY } from "@/constants/utils"

export async function getInitialMe(): Promise<IMeUser> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Usuário não autenticado no Firebase.')
  }

  const token = await user.getIdToken()

  localStorage.setItem(TOKEN_KEY, token)

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(
      `Falha ao validar a sessão (${response.status}).`,
    )
  }

  const res = (await response.json()) as IMeResponse

  if (!res.dados.cn_usuario) {
    throw new Error('Sessão inválida.')
  }

  const utilStore = useUtilStore()
  utilStore.setUser(res.dados)

  handleFirstLogin()

  return res.dados
}

export async function getUsers(
  ePage: number = 1, 
  eLimit: number = 20, 
  search: string = ''
): Promise<IUsuarioResponse> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Usuário não autenticado no Firebase.')
  }

  const token = await user.getIdToken()

  const params = new URLSearchParams({
    page: String(ePage),
    limit: String(eLimit),
    search,
  })

  const response = await fetch(
    `${API_URL}/usuarios?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error('Erro ao carregar usuários.')
  }

  return (await response.json()) as IUsuarioResponse
}

