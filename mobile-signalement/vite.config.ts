import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Ne pas externaliser Capacitor en production (APK)
    // Les modules Capacitor doivent être bundlés directement
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          leaflet: ['leaflet'],
        },
      },
    },
    // Optimiser la taille du bundle
    target: 'es2020',
    minify: 'terser',
  },
})
