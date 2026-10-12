import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { definePreset } from '@primevue/themes'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import App from './App.vue'
import router from './router'

import ToastService from 'primevue/toastservice'

import Ripple from 'primevue/ripple'
import Tooltip from 'primevue/tooltip'
import KeyFilter from 'primevue/keyfilter'
import FocusTrap from 'primevue/focustrap'

import './assets/main.css'
import 'primeicons/primeicons.css'

import locale from '@/locales/pt-BR.json'

const app = createApp(App)

// stores
app.use(createPinia())

// router
app.use(router)

const MainTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{orange.50}',
      100: '{orange.100}',
      200: '{orange.200}',
      300: '{orange.300}',
      400: '{orange.400}',
      500: '{orange.500}',
      600: '{orange.600}',
      700: '{orange.700}',
      800: '{orange.800}',
      900: '{orange.900}',
      950: '{orange.950}',
    },
    colorScheme: {
      light: {
        background: '{surface.200}',
        backgroundLight: '{surface.200}',
      },
      dark: {
        background: '{surface.200}',
        backgroundLight: '{surface.200}',
      },
    },
  },
})

app.use(PrimeVue, {
  theme: {
    preset: MainTheme,
    options: {
      darkModeSelector: 'none',
    },
  },
  locale: locale,
})

// directives
app.directive('ripple', Ripple)
app.directive('tooltip', Tooltip)
app.directive('keyfilter', KeyFilter)
app.directive('focustrap', FocusTrap)

// plugins
app.use(ToastService)

app.mount('#app')