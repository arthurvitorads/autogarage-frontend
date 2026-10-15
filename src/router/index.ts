
import { createRouter, createWebHistory } from 'vue-router'
import { signOut } from 'firebase/auth'

import MainPage from '@/components/pages/MainPage.vue'

import LoginPage from '@/views/LoginPage.vue'
import HomePage from '@/views/HomePage.vue'
import PessoaPage from '@/views/PessoaPage.vue'
import UsuarioPage from '@/views/UsuarioPage.vue'

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
          path: 'usuario',
          name: 'usuario',
          component: UsuarioPage,
          meta: {
            title: 'Usuários | AutoGarage',
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
      meReload = null
    }

    if (requiresAuth && !user) {
      localStorage.removeItem('SESSION_TOKEN')
      return { name: 'login' }
    }

    if (to.name === 'login' && user) {
      return { name: 'home' }
    }

    if (!requiresAuth) {
      return true
    }

    try {
      const token = await user!.getIdToken()

      localStorage.setItem('SESSION_TOKEN', token)

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

      localStorage.removeItem('SESSION_TOKEN')
      utilStore.cleanUser()

      await signOut(auth)

      return { name: 'login' }
    }
  } catch (error) {
    console.error('Erro na navegação:', error)
    return false
  }
})

router.afterEach(() => {
  const utilStore = useUtilStore()
  utilStore.setLoading(false)
})

router.onError(() => {
  const utilStore = useUtilStore()
  utilStore.setLoading(false)
})

export default router
