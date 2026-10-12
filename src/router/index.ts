import { createRouter, createWebHistory } from 'vue-router'
import { signOut } from 'firebase/auth'

import MainPage from '@/components/pages/MainPage.vue'
import LoginPage from '@/views/LoginPage.vue'
import HomePage from '@/views/HomePage.vue'
import PessoaPage from '@/views/PessoaPage.vue'

import { auth } from '@/services/firebase.service'
import { apiMe, isFirstLogin } from '@/services/auth.service'

import { useUtilStore } from '@/stores/util.store'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/',
      component: MainPage,
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: 'home',
          name: 'home',
          component: HomePage,
        },
        {
          path: 'pessoas',
          name: 'pessoas',
          component: PessoaPage,
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  await auth.authStateReady()

  const requiresAuth = to.matched.some(
    (record) => record.meta.requiresAuth,
  )

  const user = auth.currentUser

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


    if (isFirstLogin()) return true

    await apiMe()

    return true
  } catch {
    localStorage.removeItem('SESSION_TOKEN')

    const utilStore = useUtilStore()
    utilStore.cleanUser()

    await signOut(auth)

    return { name: 'login' }
  }
})

export default router