
import { createRouter, createWebHistory } from 'vue-router'
import { signOut } from 'firebase/auth'

import MainPage from '@/components/pages/MainPage.vue'

import LoginPage from '@/views/LoginPage.vue'
import HomePage from '@/views/HomePage.vue'
import PessoaPage from '@/views/PessoaPage.vue'
import ProdutoPage from '@/views/ProdutoPage.vue'
import ServicoPage from '@/views/ServicoPage.vue'
import UsuarioPage from '@/views/UsuarioPage.vue'
import PerfilPage from '@/views/PerfilPage.vue'
import OrdemServicoPage from '@/views/OrdemServicoPage.vue'
import OrdemServicoPainelPage from '@/views/OrdemServicoPainelPage.vue'
import OrdemServicoDetalhePage from '@/views/OrdemServicoDetalhePage.vue'

import { auth } from '@/services/firebase.service'
import { isFirstLogin } from '@/services/auth.service'
import { getInitialMe } from '@/services/user.service'

import { useUtilStore } from '@/stores/util.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: {
        title: 'Login | AutoGarage',
      },
    },
    {
      path: '/',
      component: MainPage,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: '',
          name: 'home',
          component: HomePage,
          meta: {
            title: 'Home | AutoGarage',
          },
        },
        {
          path: 'pessoa',
          name: 'pessoa',
          component: PessoaPage,
          meta: {
            title: 'Pessoas | AutoGarage',
          },
        },
        {
          path: 'produto',
          name: 'produto',
          component: ProdutoPage,
          meta: {
            title: 'Produtos | AutoGarage',
          },
        },
        {
          path: 'servico',
          name: 'servico',
          component: ServicoPage,
          meta: {
            title: 'Serviços | AutoGarage',
          },
        },
        {
          path: 'ordem-servico/cadastro',
          name: 'ordem-servico-cadastro',
          component: OrdemServicoPage,
          meta: { title: 'Cadastro de O.S. | AutoGarage' },
        },
        {
          path: 'ordem-servico/painel',
          name: 'ordem-servico-painel',
          component: OrdemServicoPainelPage,
          meta: { title: 'Painel de O.S. | AutoGarage' },
        },
        {
          path: 'ordem-servico/painel/:id',
          name: 'ordem-servico-detalhe',
          component: OrdemServicoDetalhePage,
          meta: { title: 'Ordem de Serviço | AutoGarage' },
        },
        {
          path: 'usuario',
          name: 'usuario',
          component: UsuarioPage,
          meta: {
            title: 'Usuários | AutoGarage',
          },
        },
        {
          path: 'perfil',
          name: 'perfil',
          component: PerfilPage,
          meta: {
            title: 'Perfil | AutoGarage',
          },
        },
      ],
    },
  ],
})

let meReload: string | null = null

router.beforeEach(async (to) => {
  const utilStore = useUtilStore()

  utilStore.setLoading(true)

  try {
    await auth.authStateReady()

    const requiresAuth = to.matched.some(
      (record) => record.meta.requiresAuth
    )

    const user = auth.currentUser

    if (!user) {
      utilStore.cleanUser()
      meReload = null
    }

    if (requiresAuth && !user) {
      return { name: 'login' }
    }

    if (to.name === 'login' && user) {
      return { name: 'home' }
    }

    if (!requiresAuth) {
      return true
    }

    try {
      await user!.getIdToken()

      if (isFirstLogin()) {
        return true
      }

      if (meReload !== user!.uid) {
        await getInitialMe()
        meReload = user!.uid
      }

      return true
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)

      meReload = null

      utilStore.cleanUser()

      await signOut(auth)

      return { name: 'login' }
    }
  } catch (error) {
    console.error('Erro inexperado:', error)
    return false
  } finally {

    utilStore.setLoading(false)
  }
})

export default router
