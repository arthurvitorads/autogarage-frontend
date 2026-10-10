
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'

import { IUser } from '@/interface/login'

import { auth } from '@/services/firebase.service'

const API_URL = import.meta.env.VITE_API_URL

export async function login(email: string, senha: string): Promise<IUser> {
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

    const dados = await response.json();

    const userData = dados.usuario ?? dados

    return {
      nome:
        userData.nome ??
        userData.an_nome ??
        credencial.user.displayName ??
        credencial.user.email ??
        'Usuário',
      email:
        userData.email ??
        userData.an_email ??
        credencial.user.email ??
        email,
    }
  } catch (erro) {
    // Se o backend falhar, encerra a sessão para não deixar
    // o frontend considerar o login concluído.
    await signOut(auth)
    throw erro
  }
}

export async function logout(): Promise<void> {
  await signOut(auth)
}

export function getUsuarioLogado(): IUser | null {
  const usuario = auth.currentUser

  if (!usuario) {
    return null
  }

  return {
    nome: usuario.displayName ?? usuario.email ?? 'Usuário',
    email: usuario.email ?? '',
  }
}

export function isAuthenticated(): boolean {
  return auth.currentUser !== null
}