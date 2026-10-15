import { auth } from "./firebase.service"

import { useUtilStore } from "@/stores/util.store"
import { handleFirstLogin } from "./auth.service"

import { IMeResponse, IMeUser } from "@/interface/interface-pages/LoginPage"

import { IUsuarioResponse, IFormUsuario, ICreateUserResponse, IUpdateUser } from "@/interface/interface-pages/UsuarioPage"

import { API_URL, TOKEN_KEY } from "@/constants/utils"

export async function updateUser(id: string | number, values: IUpdateUser): Promise<ICreateUserResponse> {
  const user = auth.currentUser

  if (!user) 
    throw new Error('Usuário não autenticado no Firebase.')
  
  const token = await user.getIdToken()
  
  const response = await fetch(`${API_URL}/usuarios/${encodeURIComponent(String(id))}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      an_nome: values.an_nome.trim(), 
      bo_sts_reg: values.bo_sts_reg 
    }),
  })
  
  const result = await response.json()
  
  if (!response.ok) 
    throw new Error(result.erro || 'Erro ao atualizar usuário.')
  
    return result as ICreateUserResponse
}

export async function createUser(values: IFormUsuario): Promise<ICreateUserResponse> {
  const user = auth.currentUser

  if (!user) 
    throw new Error('Usuário não autenticado no Firebase.')

  const token = await user.getIdToken()

  const response = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      an_nome: values.an_nome.trim(),
      an_email: values.an_email.trim().toLowerCase(),
      ca_senha: values.ca_senha,
      bo_sts_reg: values.bo_sts_reg,
    }),
  })

  const result = await response.json()

  if (!response.ok) 
    throw new Error(result.erro || 'Erro ao criar usuário.')

  return result as ICreateUserResponse
}

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

