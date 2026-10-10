import { createRouter, createWebHistory } from "vue-router";

import MainLayout from "@/components/pages/MainLayout.vue";
//
import LoginPage from "@/views/LoginPage.vue";
import HomePage from "@/views/HomePage.vue";
import PessoaPage from "@/views/PessoaPage.vue";

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
      component: LoginPage,
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
          component: HomePage,
        },

        {
          path: "pessoas",
          name: "pessoas",
          component: PessoaPage,
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
