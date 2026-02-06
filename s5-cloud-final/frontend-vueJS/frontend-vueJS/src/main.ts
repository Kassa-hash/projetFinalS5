import './assets/main.css'

import { createApp } from 'vue'
import CarteProblemes from './components/CarteProblemes.vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/authStore'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Restaurer la session AVANT de monter l'application
const authStore = useAuthStore()
authStore.restoreSession().then(() => {
  app.mount('#app')
  console.log('🚀 Application démarrée avec session restaurée')
})
