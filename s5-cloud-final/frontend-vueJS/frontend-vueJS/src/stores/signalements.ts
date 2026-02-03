// src/stores/signalements.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSyncService } from '@/composables/useSyncService'
import { useAuthStore } from './authStore'
import { db } from '@/firebase/config'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const useSignalementsStore = defineStore('signalements', () => {
  // État
  const signalements = ref([])
  const donneesLocales = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const lastSync = ref(null)
  const source = ref<'firebase' | 'postgres' | null>(null)

  // Composable de synchronisation
  const syncService = useSyncService()
  const authStore = useAuthStore()

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

  // 📥 Récupérer signalements via Firestore (si connecté)
  const fetchSignalementsFirebase = async (): Promise<any[]> => {
    try {
      console.log('🔥 Tentative récupération depuis Firebase...')
      const signalementsRef = collection(db, 'signalements')
      const q = query(signalementsRef, orderBy('date_signalement', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const data: any[] = []
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          firebase_id: doc.id,
          ...doc.data(),
          synced: true
        })
      })
      
      console.log(`✅ ${data.length} signalements récupérés depuis Firebase`)
      return data
    } catch (err: any) {
      console.error('❌ Erreur Firebase:', err.message)
      throw err
    }
  }

  // 📥 Récupérer signalements via PostgreSQL (fallback)
  const fetchSignalementsPostgres = async (): Promise<any[]> => {
    try {
      console.log('🗄️ Tentative récupération depuis PostgreSQL...')
      const response = await axios.get(`${API_URL}/signalements`)
      console.log(`✅ ${response.data.length} signalements récupérés depuis PostgreSQL`)
      return response.data
    } catch (err: any) {
      console.error('❌ Erreur PostgreSQL:', err.message)
      throw err
    }
  }

  // 🔄 Récupérer signalements avec fallback automatique
  const recupererSignalements = async () => {
    isLoading.value = true
    error.value = null
    source.value = null
    
    try {
      // Si l'utilisateur est connecté, essayer Firebase d'abord
      if (authStore.isAuthenticated) {
        try {
          const dataFirebase = await fetchSignalementsFirebase()
          signalements.value = dataFirebase
          source.value = 'firebase'
          lastSync.value = new Date().toISOString()
          console.log('📊 Source: Firebase')
          return dataFirebase
        } catch (firebaseErr) {
          console.warn('⚠️ Firebase échoué, fallback sur PostgreSQL...')
        }
      }
      
      // Fallback PostgreSQL
      try {
        const dataPostgres = await fetchSignalementsPostgres()
        signalements.value = dataPostgres
        source.value = 'postgres'
        lastSync.value = new Date().toISOString()
        console.log('📊 Source: PostgreSQL')
        return dataPostgres
      } catch (postgresErr) {
        throw new Error('Impossible de récupérer les signalements (Firebase et PostgreSQL indisponibles)')
      }
      
    } catch (err: any) {
      error.value = err.message || 'Erreur lors du chargement des signalements'
      console.error('❌ Erreur finale:', error.value)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const supprimerSignalement = (id) => {
    donneesLocales.value = donneesLocales.value.filter(s => s.id !== id)
    sauvegarderDonneesLocales()
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
    source,
    
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