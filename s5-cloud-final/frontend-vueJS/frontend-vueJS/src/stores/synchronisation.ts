// src/stores/synchronisation.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/firebase/config'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export interface SignalementFirebase {
  id?: string
  titre: string
  description: string
  statut: 'nouveau' | 'en_cours' | 'termine'
  date_signalement: Date | Timestamp | string
  date_debut?: Date | Timestamp | string | null
  date_fin?: Date | Timestamp | string | null
  surface_m2: number
  budget: number
  entreprise?: string
  latitude: number
  longitude: number
  type_probleme: 'nid_de_poule' | 'fissure' | 'affaissement' | 'autre'
  type_route: 'pont' | 'trottoir' | 'route' | 'piste_cyclable' | 'autre'
  synced?: boolean
  firebase_id?: string
  derniere_maj?: Date | Timestamp | string
}

export const useSynchronisationStore = defineStore('synchronisation', () => {
  // État
  const signalementsFirebase = ref<SignalementFirebase[]>([])
  const signalementsLocaux = ref<SignalementFirebase[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastSync = ref<Date | null>(null)
  const syncProgress = ref({
    total: 0,
    current: 0,
    etape: ''
  })

  // Statistiques
  const syncStats = ref({
    recus: 0,
    envoyes: 0,
    erreurs: [] as Array<{ signalement: any; erreur: string }>
  })

  // Getters
  const signalementsNonSyncs = computed(() => {
    return signalementsLocaux.value.filter(s => !s.synced)
  })

  const needsSync = computed(() => {
    return signalementsNonSyncs.value.length > 0
  })

  const totalSignalements = computed(() => {
    return signalementsFirebase.value.length
  })

  // 📥 RÉCUPÉRER depuis Firebase
  const recupererDepuisFirebase = async (): Promise<SignalementFirebase[]> => {
    try {
      console.log('🔄 Récupération depuis Firebase...')
      
      const signalementsRef = collection(db, 'signalements')
      const q = query(signalementsRef, orderBy('date_signalement', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const signalements: SignalementFirebase[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        signalements.push({
          id: doc.id,
          firebase_id: doc.id,
          ...data,
          synced: true
        } as SignalementFirebase)
      })
      
      signalementsFirebase.value = signalements
      syncStats.value.recus = signalements.length
      
      console.log(`✅ ${signalements.length} signalements récupérés depuis Firebase`)
      console.log('📄 Premier signalement:', signalements[0])
      
      return signalements
      
    } catch (err: any) {
      console.error('❌ Erreur récupération Firebase:', err)
      error.value = err.message
      throw err
    }
  }

  // 📤 ENVOYER vers PostgreSQL
  const envoyerVersPostgreSQL = async (signalement: SignalementFirebase): Promise<any> => {
    try {
      console.log('📤 Envoi vers PostgreSQL:', signalement.titre)
      
      // Convertir les timestamps Firebase en dates ISO
      const payload = {
        titre: signalement.titre || 'Sans titre',
        description: signalement.description || 'Sans description',
        statut: signalement.statut || 'nouveau',
        date_signalement: convertirDate(signalement.date_signalement),
        date_debut: signalement.date_debut ? convertirDate(signalement.date_debut) : null,
        date_fin: signalement.date_fin ? convertirDate(signalement.date_fin) : null,
        surface_m2: Number(signalement.surface_m2) || 0,
        budget: Number(signalement.budget) || 0,
        entreprise: signalement.entreprise || null,
        latitude: Number(signalement.latitude) || 0,
        longitude: Number(signalement.longitude) || 0,
        type_probleme: signalement.type_probleme || 'autre',
        type_route: signalement.type_route || 'route',
        firebase_id: signalement.firebase_id || signalement.id
      }
      
      console.log('📦 Payload envoyé:', payload)
      
      const response = await axios.post(`${API_URL}/problemes`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      console.log('✅ Réponse PostgreSQL:', response.data)
      return response.data
      
    } catch (err: any) {
      console.error('❌ Erreur détaillée envoi PostgreSQL:')
      console.error('  URL:', `${API_URL}/problemes`)
      console.error('  Status:', err.response?.status)
      console.error('  Message:', err.response?.data?.message || err.message)
      console.error('  Erreurs validation:', err.response?.data?.errors)
      console.error('  Données complètes:', err.response?.data)
      
      // Message d'erreur détaillé
      let errorMessage = err.message
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      if (err.response?.data?.errors) {
        const errors = Object.entries(err.response.data.errors)
          .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join(' | ')
        errorMessage += ` - ${errors}`
      }
      
      throw new Error(errorMessage)
    }
  }

  // 📤 ENVOYER vers Firebase
  const envoyerVersFirebase = async (signalement: SignalementFirebase): Promise<string> => {
    try {
      console.log('📤 Envoi vers Firebase:', signalement.titre)
      
      const signalementsRef = collection(db, 'signalements')
      const docRef = await addDoc(signalementsRef, {
        ...signalement,
        date_signalement: serverTimestamp(),
        derniere_maj: serverTimestamp(),
        synced: true
      })
      
      console.log('✅ Signalement envoyé vers Firebase avec ID:', docRef.id)
      return docRef.id
      
    } catch (err: any) {
      console.error('❌ Erreur envoi Firebase:', err)
      throw err
    }
  }

  // 🔄 SYNCHRONISATION COMPLÈTE
  const synchroniser = async () => {
    isLoading.value = true
    error.value = null
    syncStats.value = { recus: 0, envoyes: 0, erreurs: [] }
    
    try {
      console.log('🔄 Démarrage de la synchronisation complète...')
      
      // Étape 1: Récupérer depuis Firebase
      syncProgress.value = { total: 2, current: 1, etape: 'Récupération depuis Firebase' }
      const signalementsFirebaseData = await recupererDepuisFirebase()
      
      if (signalementsFirebaseData.length === 0) {
        console.log('⚠️ Aucun signalement dans Firebase')
        return {
          success: true,
          stats: syncStats.value,
          message: 'Aucun signalement à synchroniser'
        }
      }
      
      // Étape 2: Envoyer vers PostgreSQL
      syncProgress.value = { 
        total: signalementsFirebaseData.length, 
        current: 0, 
        etape: 'Envoi vers PostgreSQL' 
      }
      
      for (let i = 0; i < signalementsFirebaseData.length; i++) {
        const signalement = signalementsFirebaseData[i]
        syncProgress.value.current = i + 1
        
        console.log(`\n📋 Traitement ${i + 1}/${signalementsFirebaseData.length}: ${signalement.titre}`)
        
        try {
          // Vérifier si existe déjà dans PostgreSQL
          const exists = await verifierExistencePostgreSQL(signalement.firebase_id!)
          
          if (!exists) {
            console.log('  ➡️ Nouveau signalement, envoi...')
            await envoyerVersPostgreSQL(signalement)
            syncStats.value.envoyes++
            console.log('  ✅ Envoyé avec succès')
          } else {
            console.log(`  ⏭️ Déjà existant dans PostgreSQL`)
          }
          
        } catch (err: any) {
          console.error(`  ❌ Erreur pour "${signalement.titre}":`, err.message)
          syncStats.value.erreurs.push({
            signalement: signalement.titre,
            erreur: err.message
          })
        }
      }
      
      // Étape 3: Envoyer les données locales vers Firebase
      if (signalementsNonSyncs.value.length > 0) {
        syncProgress.value = {
          total: signalementsNonSyncs.value.length,
          current: 0,
          etape: 'Envoi données locales vers Firebase'
        }
        
        for (let i = 0; i < signalementsNonSyncs.value.length; i++) {
          const signalement = signalementsNonSyncs.value[i]
          syncProgress.value.current = i + 1
          
          try {
            await envoyerVersFirebase(signalement)
            signalement.synced = true
          } catch (err: any) {
            syncStats.value.erreurs.push({
              signalement: signalement.titre,
              erreur: err.message
            })
          }
        }
      }
      
      lastSync.value = new Date()
      sauvegarderDonneesLocales()
      
      console.log('\n✅ Synchronisation terminée:', syncStats.value)
      
      // Afficher le détail des erreurs
      if (syncStats.value.erreurs.length > 0) {
        console.error('\n⚠️ Erreurs rencontrées:')
        syncStats.value.erreurs.forEach((err, index) => {
          console.error(`  ${index + 1}. ${err.signalement}: ${err.erreur}`)
        })
      }
      
      return {
        success: true,
        stats: syncStats.value
      }
      
    } catch (err: any) {
      console.error('❌ Erreur synchronisation:', err)
      error.value = err.message
      return {
        success: false,
        erreur: err.message,
        stats: syncStats.value
      }
    } finally {
      isLoading.value = false
      syncProgress.value = { total: 0, current: 0, etape: '' }
    }
  }

  // Vérifier si un signalement existe déjà dans PostgreSQL
  const verifierExistencePostgreSQL = async (firebaseId: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_URL}/problemes/check/${firebaseId}`)
      return response.data.exists
    } catch (err: any) {
      // Si l'endpoint n'existe pas (404), on considère que ça n'existe pas
      if (err.response?.status === 404) {
        return false
      }
      console.warn('⚠️ Impossible de vérifier l\'existence:', err.message)
      return false
    }
  }

  // Convertir les dates Firebase en format ISO
  const convertirDate = (date: any): string => {
    if (!date) return new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
    
    try {
      // Si c'est un Timestamp Firebase
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toISOString().split('T')[0]
      }
      
      // Si c'est déjà une Date
      if (date instanceof Date) {
        return date.toISOString().split('T')[0]
      }
      
      // Si c'est une string
      if (typeof date === 'string') {
        return new Date(date).toISOString().split('T')[0]
      }
      
      return new Date().toISOString().split('T')[0]
    } catch (err) {
      console.warn('⚠️ Erreur conversion date:', err)
      return new Date().toISOString().split('T')[0]
    }
  }

  // Charger depuis localStorage
  const chargerDonneesLocales = () => {
    const stored = localStorage.getItem('signalements_locaux')
    if (stored) {
      signalementsLocaux.value = JSON.parse(stored)
    }
  }

  // Sauvegarder dans localStorage
  const sauvegarderDonneesLocales = () => {
    localStorage.setItem('signalements_locaux', JSON.stringify(signalementsLocaux.value))
  }

  // Ajouter un signalement localement
  const ajouterSignalement = (signalement: Omit<SignalementFirebase, 'id' | 'synced'>) => {
    const nouveau: SignalementFirebase = {
      ...signalement,
      id: `local_${Date.now()}`,
      synced: false,
      date_signalement: new Date().toISOString()
    }
    
    signalementsLocaux.value.push(nouveau)
    sauvegarderDonneesLocales()
    
    return nouveau
  }

  // Réinitialiser
  const reinitialiser = () => {
    signalementsFirebase.value = []
    signalementsLocaux.value = []
    lastSync.value = null
    syncStats.value = { recus: 0, envoyes: 0, erreurs: [] }
    localStorage.removeItem('signalements_locaux')
  }

  // Initialiser
  chargerDonneesLocales()

  return {
    // État
    signalementsFirebase,
    signalementsLocaux,
    isLoading,
    error,
    lastSync,
    syncProgress,
    syncStats,
    
    // Getters
    signalementsNonSyncs,
    needsSync,
    totalSignalements,
    
    // Actions
    recupererDepuisFirebase,
    envoyerVersPostgreSQL,
    envoyerVersFirebase,
    synchroniser,
    ajouterSignalement,
    chargerDonneesLocales,
    sauvegarderDonneesLocales,
    reinitialiser
  }
})