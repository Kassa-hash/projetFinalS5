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

 // Dans src/stores/synchronisation.ts

// 📤 ENVOYER vers PostgreSQL
const envoyerVersPostgreSQL = async (signalement: SignalementFirebase): Promise<any> => {
  try {
    console.log('📤 Envoi vers PostgreSQL:', signalement.titre)
    console.log('📦 Données brutes:', signalement)
    
    // ✨ VALIDATION ET MAPPING DES VALEURS
    const typesProblemeValides = ['nid_de_poule', 'fissure', 'affaissement', 'autre']
    const typesRouteValides = ['pont', 'trottoir', 'route', 'piste_cyclable', 'autre']
    const statutsValides = ['nouveau', 'en_cours', 'termine']
    
    // Fonction pour valider type_probleme
    const validerTypeProbleme = (type: string): string => {
      if (!type) return 'autre'
      
      // Normaliser la valeur (minuscules, remplacer espaces par underscores)
      const typeNormalise = type.toLowerCase().trim().replace(/\s+/g, '_')
      
      if (typesProblemeValides.includes(typeNormalise)) {
        return typeNormalise
      }
      
      // Mapping intelligent de valeurs similaires
      const mappings: Record<string, string> = {
        'nid': 'nid_de_poule',
        'poule': 'nid_de_poule',
        'trou': 'nid_de_poule',
        'crack': 'fissure',
        'cassure': 'fissure',
        'affaiss': 'affaissement',
        'effondrement': 'affaissement'
      }
      
      // Chercher une correspondance partielle
      for (const [key, value] of Object.entries(mappings)) {
        if (typeNormalise.includes(key)) {
          console.warn(`⚠️ Type problème "${type}" mappé vers "${value}"`)
          return value
        }
      }
      
      console.warn(`⚠️ Type problème invalide: "${type}", mapping vers "autre"`)
      return 'autre'
    }
    
    // Fonction pour valider type_route
    const validerTypeRoute = (type: string): string => {
      if (!type) return 'route'
      
      const typeNormalise = type.toLowerCase().trim().replace(/\s+/g, '_')
      
      if (typesRouteValides.includes(typeNormalise)) {
        return typeNormalise
      }
      
      // Mapping intelligent
      const mappings: Record<string, string> = {
        'chaussee': 'route',
        'voie': 'route',
        'rue': 'route',
        'avenue': 'route',
        'passerelle': 'pont',
        'viaduc': 'pont',
        'trottoirs': 'trottoir',
        'piste': 'piste_cyclable',
        'cyclable': 'piste_cyclable',
        'velo': 'piste_cyclable'
      }
      
      for (const [key, value] of Object.entries(mappings)) {
        if (typeNormalise.includes(key)) {
          console.warn(`⚠️ Type route "${type}" mappé vers "${value}"`)
          return value
        }
      }
      
      console.warn(`⚠️ Type route invalide: "${type}", mapping vers "route"`)
      return 'route'
    }
    
    // Fonction pour valider statut
    const validerStatut = (statut: string): string => {
      if (!statut) return 'nouveau'
      
      const statutNormalise = statut.toLowerCase().trim().replace(/\s+/g, '_')
      
      if (statutsValides.includes(statutNormalise)) {
        return statutNormalise
      }
      
      // Mapping des variations
      const mappings: Record<string, string> = {
        'new': 'nouveau',
        'ouvert': 'nouveau',
        'open': 'nouveau',
        'progress': 'en_cours',
        'encours': 'en_cours',
        'traitement': 'en_cours',
        'done': 'termine',
        'fini': 'termine',
        'complete': 'termine',
        'closed': 'termine',
        'ferme': 'termine'
      }
      
      for (const [key, value] of Object.entries(mappings)) {
        if (statutNormalise.includes(key)) {
          console.warn(`⚠️ Statut "${statut}" mappé vers "${value}"`)
          return value
        }
      }
      
      console.warn(`⚠️ Statut invalide: "${statut}", mapping vers "nouveau"`)
      return 'nouveau'
    }
    
    // Nettoyer l'entreprise (Firebase a " entreprise" avec espace au début)
    let entreprise = signalement.entreprise || (signalement as any)[' entreprise']
    if (entreprise && typeof entreprise === 'string') {
      entreprise = entreprise.trim()
    } else {
      entreprise = null
    }
    
    // 🔧 FONCTION pour récupérer une valeur avec gestion des espaces parasites dans les clés Firebase
    const getFirebaseValue = (obj: any, key: string): any => {
      // Essayer d'abord la clé exacte
      if (obj[key] !== undefined) return obj[key]
      // Essayer avec espace avant
      if (obj[` ${key}`] !== undefined) return obj[` ${key}`]
      // Essayer avec espace après
      if (obj[`${key} `] !== undefined) return obj[`${key} `]
      // Essayer avec espaces avant et après
      if (obj[` ${key} `] !== undefined) return obj[` ${key} `]
      return undefined
    }
    
    // Récupérer les valeurs avec gestion des espaces
    const titre = getFirebaseValue(signalement, 'titre') || 'Sans titre'
    const description = getFirebaseValue(signalement, 'description') || 'Sans description'
    const statut = getFirebaseValue(signalement, 'statut') || 'nouveau'
    const latitude = getFirebaseValue(signalement, 'latitude') || 0
    const longitude = getFirebaseValue(signalement, 'longitude') || 0
    const surface_m2 = getFirebaseValue(signalement, 'surface_m2') || 0
    const budget = getFirebaseValue(signalement, 'budget') || 0
    const type_probleme = getFirebaseValue(signalement, 'type_probleme') || 'autre'
    const type_route = getFirebaseValue(signalement, 'type_route') || 'route'
    const date_signalement = getFirebaseValue(signalement, 'date_signalement')
    const date_debut = getFirebaseValue(signalement, 'date_debut')
    const date_fin = getFirebaseValue(signalement, 'date_fin')
    
    console.log('🔍 Valeurs extraites avec gestion des espaces:')
    console.log('  - description brute:', getFirebaseValue(signalement, 'description'))
    console.log('  - latitude brute:', getFirebaseValue(signalement, 'latitude'))
    
    // Convertir et valider les données
    const payload = {
      titre: String(titre).trim(),
      description: String(description).trim(),
      statut: validerStatut(statut),
      date_signalement: convertirDate(date_signalement),
      date_debut: date_debut ? convertirDate(date_debut) : null,
      date_fin: date_fin ? convertirDate(date_fin) : null,
      surface_m2: parseFloat(String(surface_m2)),
      budget: parseFloat(String(budget)),
      entreprise: entreprise,
      latitude: parseFloat(String(latitude)),
      longitude: parseFloat(String(longitude)),
      type_probleme: validerTypeProbleme(type_probleme),
      type_route: validerTypeRoute(type_route),
      firebase_id: signalement.firebase_id || signalement.id || null
    }
    
    console.log('📦 Payload envoyé:', JSON.stringify(payload, null, 2))
    
    // Validation avant envoi
    if (!payload.titre || payload.titre === 'Sans titre') {
      throw new Error('Le titre est requis')
    }
    
    if (!payload.description || payload.description === 'Sans description') {
      throw new Error('La description est requise')
    }
    
    if (payload.latitude === 0 && payload.longitude === 0) {
      console.warn('⚠️ Coordonnées GPS manquantes ou nulles')
    }
    
    const response = await axios.post(`${API_URL}/problemes`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 secondes timeout
    })
    
    console.log('✅ Réponse PostgreSQL:', response.data)
    return response.data
    
  } catch (err: any) {
    console.error('❌ Erreur détaillée envoi PostgreSQL:')
    console.error('  URL:', `${API_URL}/problemes`)
    console.error('  Status:', err.response?.status)
    console.error('  Message:', err.response?.data?.message || err.message)
    console.error('  Erreurs validation:', err.response?.data?.errors)
    console.error('  Messages:', err.response?.data?.messages)
    console.error('  Données complètes:', err.response?.data)
    
    // Message d'erreur détaillé
    let errorMessage = err.message
    
    if (err.response?.data?.messages) {
      const messages = err.response.data.messages
      const errorDetails = Object.entries(messages)
        .map(([field, msgs]: [string, any]) => {
          const msgArray = Array.isArray(msgs) ? msgs : [msgs]
          return `${field}: ${msgArray.join(', ')}`
        })
        .join(' | ')
      errorMessage = errorDetails
    } else if (err.response?.data?.errors) {
      const errors = Object.entries(err.response.data.errors)
        .map(([field, msgs]: [string, any]) => {
          const msgArray = Array.isArray(msgs) ? msgs : [msgs]
          return `${field}: ${msgArray.join(', ')}`
        })
        .join(' | ')
      errorMessage = errors
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message
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