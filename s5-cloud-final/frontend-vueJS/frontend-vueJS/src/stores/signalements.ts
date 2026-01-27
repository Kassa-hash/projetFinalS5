// src/stores/signalements.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSyncService } from '@/composables/useSyncService'

export const useSignalementsStore = defineStore('signalements', () => {
  // État
  const signalements = ref([])
  const donneesLocales = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastSync = ref(null)

  // Composable de synchronisation
  const syncService = useSyncService()

  // Getters
  const signalementsNonSyncs = computed(() => {
    return donneesLocales.value.filter(d => !d.synced)
  })

  const totalSignalements = computed(() => {
    return signalements.value.length
  })

  const needsSync = computed(() => {
    return signalementsNonSyncs.value.length > 0
  })

  // Actions
  const chargerDonneesLocales = () => {
    const stored = localStorage.getItem('signalements')
    if (stored) {
      donneesLocales.value = JSON.parse(stored)
    }
  }

  const sauvegarderDonneesLocales = () => {
    localStorage.setItem('signalements', JSON.stringify(donneesLocales.value))
  }

  const ajouterSignalement = (nouveauSignalement) => {
    const signalement = {
      ...nouveauSignalement,
      id: `local_${Date.now()}`,
      synced: false,
      dateCreation: new Date().toISOString(),
      utilisateur: 'user_id' // À adapter selon votre système d'auth
    }
    
    donneesLocales.value.push(signalement)
    sauvegarderDonneesLocales()
    
    return signalement
  }

  const synchroniser = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const resultat = await syncService.synchroniser(donneesLocales.value)
      
      if (resultat.success) {
        // Mettre à jour les signalements distants
        signalements.value = resultat.signalements
        
        // Marquer les données locales comme synchronisées
        donneesLocales.value = donneesLocales.value.map(d => ({
          ...d,
          synced: true
        }))
        sauvegarderDonneesLocales()
        
        lastSync.value = new Date().toISOString()
        
        return resultat
      } else {
        error.value = resultat.erreur
        return resultat
      }
      
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const recupererSignalements = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const data = await syncService.recupererSignalements()
      signalements.value = data
      lastSync.value = new Date().toISOString()
      return data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const supprimerSignalement = (id) => {
    donneesLocales.value = donneesLocales.value.filter(s => s.id !== id)
    sauvegarderDonneesLocales()
  }

  const reinitialiser = () => {
    signalements.value = []
    donneesLocales.value = []
    lastSync.value = null
    localStorage.removeItem('signalements')
  }

  // Initialiser au chargement
  chargerDonneesLocales()

  return {
    // État
    signalements,
    donneesLocales,
    isLoading,
    error,
    lastSync,
    
    // Getters
    signalementsNonSyncs,
    totalSignalements,
    needsSync,
    
    // Actions
    ajouterSignalement,
    synchroniser,
    recupererSignalements,
    supprimerSignalement,
    chargerDonneesLocales,
    sauvegarderDonneesLocales,
    reinitialiser
  }
})