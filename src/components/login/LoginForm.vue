
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../../services/authService'

import { useUtilStore } from '../../stores/util.store'
import { storeToRefs } from 'pinia'

const utilStore = useUtilStore()

const router = useRouter()

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const erro = ref('')

async function fazerLogin() {
  erro.value = ''

  if (!email.value.trim() || !senha.value) {
    erro.value = 'Preencha o e-mail e a senha.'
    return
  }

  utilStore.setLoading(true)

  try {
    await login(email.value.trim(), senha.value)
    await router.push('/home')
  } catch (error: unknown) {
    const codigo = (error as { code?: string })?.code

    switch (codigo) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        erro.value = 'E-mail ou senha incorretos.'
        break

      case 'auth/invalid-email':
        erro.value = 'Informe um endereço de e-mail válido.'
        break

      case 'auth/too-many-requests':
        erro.value = 'Muitas tentativas de login. Tente novamente mais tarde.'
        break

      case 'auth/network-request-failed':
        erro.value = 'Falha de conexão. Verifique sua internet e tente novamente.'
        break

      default:
        erro.value =
          error instanceof Error
            ? error.message
            : 'Não foi possível entrar. Tente novamente.'
    }
  } finally {
    utilStore.setLoading(false)
  }
}

</script>

<template>
  <section class="form-panel">
    <div class="form-container">

      <div class="mobile-brand">
        Auto<strong>Garage</strong>
      </div>

      <div class="welcome">
        
       

        <h2>Bem-vindo de volta!</h2>

        <p>
          Entre com suas credenciais para acessar o sistema.
        </p>
      </div>

      <form @submit.prevent="fazerLogin">

        <div class="form-group">
          <label for="email">E-mail</label>

          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="seu@email.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-group">
          <div class="label-row">
            <label for="senha">Senha</label>
          </div>

          <div class="password-field">
            <input
              id="senha"
              v-model="senha"
              :type="mostrarSenha ? 'text' : 'password'"
              placeholder="Digite sua senha"
              autocomplete="current-password"
              required
            />

            <button
              type="button"
              class="show-password"
              @click="mostrarSenha = !mostrarSenha"
            >
              {{ mostrarSenha ? 'Ocultar' : 'Mostrar' }}
            </button>
          </div>
        </div>

        <div class="form-options">
          <label class="remember">
            <input type="checkbox" />
            Lembrar de mim
          </label>
        </div>

        <p v-if="erro" class="error-message">
          {{ erro }}
        </p>

        <button type="submit" class="login-button">
          Entrar no sistema
        </button>

      </form>

      <div class="form-footer">
        <p>Problemas para acessar?</p>

        <a href="mailto:suporte@seudominio.com">
          Entre em contato com o suporte
        </a>
      </div>
    </div>

    <div class="security-note">
      © 2026 AutoGarage. Todos os direitos reservados.
    </div>
  </section>
</template>