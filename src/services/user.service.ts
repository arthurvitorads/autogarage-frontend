import { auth } from "./firebase.service"

import { useUtilStore } from "@/stores/util.store"
import { handleFirstLogin } from "./auth.service"

import { IUser, IUserResponse } from "@/interface/login"

import { API_URL, TOKEN_KEY } from "@/constants/utils"

export async function getInitialMe(): Promise<IUser> {
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

  const res = (await response.json()) as IUserResponse

  if (!res.dados.cn_usuario) {
    throw new Error('Sessão inválida.')
  }

  const utilStore = useUtilStore()
  utilStore.setUser(res.dados)

  handleFirstLogin()

  return res.dados
}