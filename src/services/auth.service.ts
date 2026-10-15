import { ref } from 'vue'

import { signInWithEmailAndPassword, signOut } from 'firebase/auth'

import { auth } from '@/services/firebase.service'
import { useUtilStore } from '@/stores/util.store'

import { IFormLogin, IMeUser } from '@/interface/pages/LoginPage'

import { getInitialMe } from './user.service'

import { TOKEN_KEY } from '@/constants/utils'

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

export async function login(value: IFormLogin): Promise<IMeUser> {

  const utilStore = useUtilStore()

  try {
    await signInWithEmailAndPassword(auth, value.an_email.trim(), value.ca_senha)

    return await getInitialMe()
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