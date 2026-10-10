import { ref } from 'vue'

import { signInWithEmailAndPassword, signOut } from 'firebase/auth'

import { auth } from '@/services/firebase.service'
import { useUtilStore } from '@/stores/util.store'

import { IUserResponse } from '@/interface/login'

const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'SESSION_TOKEN'

const firstLogin = ref(false)

export function handleFirstLogin () {
  firstLogin.value = true
}

export function isFirstLogin(): boolean {
  if (firstLogin.value) {
    firstLogin.value = false
    return true
  }

  return false
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return auth.currentUser !== null
}

export async function apiMe(): Promise<IUserResponse> {
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

  const dados = (await response.json()) as IUserResponse

  if (!dados.autenticado) {
    throw new Error('Sessão inválida.')
  }

  const utilStore = useUtilStore()
  utilStore.setUser(dados.usuario)

  handleFirstLogin()

  return dados
}

export async function login(
  email: string,
  senha: string,
): Promise<IUserResponse> {
  const utilStore = useUtilStore()

  try {
    await signInWithEmailAndPassword(auth, email.trim(), senha)

    return await apiMe()
  } catch (erro) {
    localStorage.removeItem(TOKEN_KEY)
    utilStore.cleanUser()

    await signOut(auth)
    throw erro
  }
}

export async function logout(): Promise<void> {
  const utilStore = useUtilStore()

  localStorage.removeItem(TOKEN_KEY)
  utilStore.cleanUser()

  await signOut(auth)
}