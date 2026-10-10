
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'

import { auth } from '@/services/firebase.service'
import { useUtilStore } from '@/stores/util.store'

import { IUserResponse } from '@/interface/login'

const API_URL = import.meta.env.VITE_API_URL


export async function login(email: string, senha: string): Promise<IUserResponse> {
  const { setUser, cleanUser } = useUtilStore()
  
  const credencial = await signInWithEmailAndPassword(auth, email.trim(), senha)

  try {
    const token = await credencial.user.getIdToken()

    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Usuário não encontrado no sistema')
      }

      throw new Error(`Falha ao consultar o usuário na API (${response.status}).`)
    }

    const dados = await response.json() as IUserResponse;

    if (!dados.autenticado) {
      throw new Error('Usuário não autenticado na API.')
    }

    setUser(dados.usuario)

    return dados
  } catch (erro) {      
    cleanUser()

    await signOut(auth)
    throw erro
  }
}

export async function logout(): Promise<void> {
  await signOut(auth)
}

export function isAuthenticated(): boolean {
  return auth.currentUser !== null
}