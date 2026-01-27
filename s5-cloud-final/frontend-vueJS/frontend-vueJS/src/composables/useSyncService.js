// src/composables/useSyncService.js
import { ref } from 'vue'
import { db } from '@/firebase/config'
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'

export function useSyncService() {
  const isLoading = ref(false)
  const error = ref(null)
  const syncStats = ref({
    recues: 0,
    envoyees: 0,
    erreurs: []
  })

  // 1. RÉCUPÉRER les signalements depuis Firebase
  const recupererSignalements = async () => {
    try {
      console.log('🔄 Récupération des signalements...')
      
      const signalementsRef = collection(db, 'signalements')
      const q = query(signalementsRef, orderBy('dateCreation', 'desc'))
      const querySnapshot = await getDocs(q)
      
      const signalements = []
      querySnapshot.forEach((doc) => {
        signalements.push({
          id: doc.id,
          ...doc.data()
        })
      })
      
      console.log(`✅ ${signalements.length} signalements récupérés`)
      return signalements
      
    } catch (err) {
      console.error('❌ Erreur récupération:', err)
      error.value = err.message
      throw err
    }
  }

  // 2. ENVOYER un signalement vers Firebase
  const envoyerSignalement = async (signalementData) => {
    try {
      console.log('📤 Envoi du signalement...')
      
      const signalementsRef = collection(db, 'signalements')
      const docRef = await addDoc(signalementsRef, {
        ...signalementData,
        dateCreation: serverTimestamp(),
        synced: true,
        derniereMaj: serverTimestamp()
      })
      
      console.log('✅ Signalement envoyé avec ID:', docRef.id)
      return docRef.id
      
    } catch (err) {
      console.error('❌ Erreur envoi:', err)
      error.value = err.message
      throw err
    }
  }

  // 3. SYNCHRONISATION COMPLÈTE
  const synchroniser = async (donneesLocales = []) => {
    isLoading.value = true
    error.value = null
    
    try {
      console.log('🔄 Démarrage de la synchronisation...')
      
      const resultats = {
        recues: 0,
        envoyees: 0,
        erreurs: []
      }
      
      // Étape 1: Récupérer les données en ligne
      const signalementsDistants = await recupererSignalements()
      resultats.recues = signalementsDistants.length
      
      // Étape 2: Envoyer les données locales non synchronisées
      const aEnvoyer = donneesLocales.filter(d => !d.synced)
      
      for (const donnee of aEnvoyer) {
        try {
          await envoyerSignalement(donnee)
          resultats.envoyees++
        } catch (err) {
          resultats.erreurs.push({
            donnee,
            erreur: err.message
          })
        }
      }
      
      syncStats.value = resultats
      console.log('✅ Synchronisation terminée:', resultats)
      
      return {
        success: true,
        ...resultats,
        signalements: signalementsDistants
      }
      
    } catch (err) {
      console.error('❌ Erreur synchronisation:', err)
      error.value = err.message
      return {
        success: false,
        erreur: err.message
      }
    } finally {
      isLoading.value = false
    }
  }

  // Mettre à jour un signalement
  const mettreAJourSignalement = async (id, nouvellesDonnees) => {
    try {
      const docRef = doc(db, 'signalements', id)
      await updateDoc(docRef, {
        ...nouvellesDonnees,
        derniereMaj: serverTimestamp()
      })
      
      console.log('✅ Signalement mis à jour:', id)
      return true
      
    } catch (err) {
      console.error('❌ Erreur mise à jour:', err)
      error.value = err.message
      throw err
    }
  }

  return {
    isLoading,
    error,
    syncStats,
    recupererSignalements,
    envoyerSignalement,
    synchroniser,
    mettreAJourSignalement
  }
}