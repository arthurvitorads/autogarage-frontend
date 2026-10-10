
import { createApp } from 'vue'
import { createPinia } from 'pinia'

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

app.use(PrimeVue, {
  theme: {
    preset: Aura,
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