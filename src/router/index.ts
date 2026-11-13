import { createRouter, createWebHistory } from 'vue-router'
import { signOut } from 'firebase/auth'

import MainPage from '@/components/pages/MainPage.vue'

import LoginPage from '@/views/LoginPage.vue'
import NotFoundView from '@/views/404View.vue'
import HomePage from '@/views/HomePage.vue'
import PessoaPage from '@/views/pages/PessoaPage.vue'
import ProdutoPage from '@/views/pages/ProdutoPage.vue'
import ServicoPage from '@/views/pages/ServicoPage.vue'
import UsuarioPage from '@/views/pages/UsuarioPage.vue'
import VendaPage from '@/views/pages/VendaPage.vue'
import PerfilPage from '@/views/pages/PerfilPage.vue'
import OrdemServicoPainelPage from '@/views/pages/OsPainelPage.vue'
import OrdemServicoDetalhePage from '@/views/pages/OsDetalhesPage.vue'

import { auth } from '@/services/firebase.service'
import { isFirstLogin } from '@/services/auth.service'
import { getInitialMe } from '@/services/user.service'

import { useUtilStore } from '@/stores/util.store'
import type { TModule } from '@/interface/access'

declare module 'vue-router' {
  interface RouteMeta {
    module?: TModule
  }
}

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
            title: 'Início | AutoGarage',
          },
        },
        {
          path: 'pessoa',
          name: 'pessoa',
          component: PessoaPage,
          meta: {
            module: 'CADASTROS',
            title: 'Pessoas | AutoGarage',
          },
        },
        {
          path: 'produto',
          name: 'produto',
          component: ProdutoPage,
          meta: {
            module: 'CADASTROS',
            title: 'Produtos | AutoGarage',
          },
        },
        {
          path: 'servico',
          name: 'servico',
          component: ServicoPage,
          meta: {
            module: 'CADASTROS',
            title: 'Serviços | AutoGarage',
          },
        },
        {
          path: 'ordem-servico/painel',
          name: 'ordem-servico-painel',
          component: OrdemServicoPainelPage,
          meta: { module: 'ORDEM_SERVICO', title: 'Painel de O.S. | AutoGarage' },
        },
        {
          path: 'ordem-servico/painel/:id',
          name: 'ordem-servico-detalhe',
          component: OrdemServicoDetalhePage,
          meta: { module: 'ORDEM_SERVICO', title: 'Ordem de Serviço | AutoGarage' },
        },
        {
          path: 'faturamento/vendas',
          name: 'faturamento-vendas',
          component: VendaPage,
          meta: { module: 'FATURAMENTO', title: 'Vendas | AutoGarage' },
        },
        {
          path: 'usuario',
          name: 'usuario',
          component: UsuarioPage,
          meta: {
            module: 'ADMINISTRACAO',
            title: 'Usuários | AutoGarage',
          },
        },
        {
          path: 'perfil',
          name: 'perfil',
          component: PerfilPage,
          meta: {
            module: 'ADMINISTRACAO',
            title: 'Perfil | AutoGarage',
          },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { title: 'Página não encontrada | AutoGarage' },
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.name === 'not-found') return true

  const utilStore = useUtilStore()

  utilStore.setLoading(true)

  try {
    await auth.authStateReady()

    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

    const user = auth.currentUser

    if (!user) {
      utilStore.cleanUser()
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
      if (!isFirstLogin() || !utilStore.user) await getInitialMe()
      if (to.meta.module && !utilStore.canRead(to.meta.module)) return { name: 'home' }
      return true
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)

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

router.afterEach((to, _from, failure) => {
  if (!failure) {
    document.title = String(to.meta.title || 'AutoGarage')
  }
})

export default router
