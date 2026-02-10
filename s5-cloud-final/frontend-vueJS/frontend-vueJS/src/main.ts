import './assets/main.css'

import { createApp } from 'vue'
import CarteProblemes from './components/CarteProblemes.vue';
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// app.component('CarteProblemes', CarteProblemes);

app.use(createPinia())
app.use(router)

app.mount('#app')
