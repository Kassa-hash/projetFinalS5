// src/composables/useOfflineSync.js
import { ref, onMounted, onUnmounted } from 'vue'
import { useSignalementsStore } from '@/stores/signalements'

export function useOfflineSync() {
  const isOnline = ref(navigator.onLine)
  const store = useSignalementsStore()

  const handleOnline = async () => {
    console.log('✅ Connexion rétablie')
    isOnline.value = true
    
    // Synchroniser automatiquement
    if (store.needsSync) {
      try {
        await store.synchroniser()
        console.log('✅ Synchronisation automatique réussie')
      } catch (error) {
        console.error('❌ Erreur synchronisation auto:', error)
      }
    }
  }

  const handleOffline = () => {
    console.log('📡 Hors ligne')
    isOnline.value = false
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    isOnline
  }
}