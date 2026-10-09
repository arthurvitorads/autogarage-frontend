
import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

import { auth } from './firebase'

export interface UsuarioLogado {
  nome: string
  email: string
}

const API_URL = import.meta.env.VITE_API_URL

export async function login(
  email: string,
  senha: string,
): Promise<UsuarioLogado> {
  // 1. Autentica o usuário no Firebase
  const credencial = await signInWithEmailAndPassword(
    auth,
    email.trim(),
    senha,
  )

  try {
    // 2. Obtém o token de autenticação
    const token = await credencial.user.getIdToken()

    // 3. Solicita ao backend os dados do usuário
    const resposta = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!resposta.ok) {
      if (resposta.status === 404) {
        throw new Error(
          'Usuário autenticado no Firebase, mas não cadastrado no banco do AutoGarage.',
        )
      }

      throw new Error(
        `Falha ao consultar o usuário na API (${resposta.status}).`,
      )
    }

    const dados = await resposta.json()

    // Aceita tanto uma resposta direta quanto uma resposta
    // no formato { usuario: { ... } }.
    const usuarioApi = dados.usuario ?? dados

    return {
      nome:
        usuarioApi.nome ??
        usuarioApi.an_nome ??
        credencial.user.displayName ??
        credencial.user.email ??
        'Usuário',
      email:
        usuarioApi.email ??
        usuarioApi.an_email ??
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

export function getUsuarioLogado(): UsuarioLogado | null {
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