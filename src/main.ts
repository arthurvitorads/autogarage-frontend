import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { definePreset } from '@primevue/themes'

import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import App from './App.vue'
import router from './router'

import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

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
      50: '{purple.50}',
      100: '{purple.100}',
      200: '{purple.200}',
      300: '{purple.300}',
      400: '{purple.400}',
      500: '{purple.500}',
      600: '{purple.600}',
      700: '{purple.700}',
      800: '{purple.800}',
      900: '{purple.900}',
      950: '{purple.950}',
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
app.use(ConfirmationService)

app.mount('#app')