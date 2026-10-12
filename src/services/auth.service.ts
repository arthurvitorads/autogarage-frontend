import { ref } from 'vue'

import { signInWithEmailAndPassword, signOut } from 'firebase/auth'

import { auth } from '@/services/firebase.service'
import { useUtilStore } from '@/stores/util.store'

import { IFormLogin, IUserResponse } from '@/interface/login'

const API_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'SESSION_TOKEN'

const firstLogin = ref(false)

export function handleFirstLogin() {
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

function normalizeError(error: unknown): string {
  const code = (error as { code?: string })?.code

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha incorretos.'
    case 'auth/invalid-email':
      return 'Informe um endereço de e-mail válido.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas de login. Tente novamente mais tarde.'
    case 'auth/network-request-failed':
      return 'Falha de conexão. Verifique sua internet e tente novamente.'
    default:
      return error instanceof Error ? error.message : 'Não foi possível entrar. Tente novamente.'
  }
}

export async function login(value: IFormLogin): Promise<IUserResponse> {

  const utilStore = useUtilStore()

  try {
    await signInWithEmailAndPassword(auth, value.an_email.trim(), value.ca_senha)

    return await apiMe()
  } catch (erro) {
    localStorage.removeItem(TOKEN_KEY)
    utilStore.cleanUser()

    await signOut(auth)

    throw new Error(normalizeError(erro))
  }
}

export async function logout(): Promise<void> {
  const utilStore = useUtilStore()

  localStorage.removeItem(TOKEN_KEY)
  utilStore.cleanUser()

  await signOut(auth)
}