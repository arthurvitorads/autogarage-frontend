import { createRouter, createWebHistory } from "vue-router";

import LoginView from "../views/LoginView.vue";
import HomeView from "../views/HomeView.vue";
import PessoaCadastroView from "../views/PessoaCadastroView.vue";

import MainLayout from "../layouts/MainLayout.vue";

import { isAuthenticated } from "../services/authService";

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: "/",
      redirect: "/home",
    },

    {
      path: "/login",
      name: "login",
      component: LoginView,
    },

    {
      path: "/",
      component: MainLayout,
      meta: {
        requiresAuth: true,
      },

      children: [
        {
          path: "home",
          name: "home",
          component: HomeView,
        },

        {
          path: "pessoas",
          name: "pessoas",
          component: PessoaCadastroView,
        },
      ],
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    return {
      name: "login",
    };
  }

  if (to.name === "login" && isAuthenticated()) {
    return {
      name: "home",
    };
  }
});

export default router;
