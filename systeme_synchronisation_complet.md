# Système de Synchronisation Firebase ↔ PostgreSQL

## Architecture Complète

```
┌─────────────────┐
│  Firebase       │ ← Données en ligne (signalements)
└────────┬────────┘
         │
         │ Synchronisation
         │
┌────────▼────────┐
│  Vue.js App     │ ← Interface utilisateur
│  (Frontend)     │
└────────┬────────┘
         │
         │ API REST
         │
┌────────▼────────┐
│  Backend API    │ ← Laravel/Node.js
│  (PostgreSQL)   │
└─────────────────┘
```

---

## Fichiers à Créer/Modifier

### 1. Store Pinia pour Synchronisation

**Fichier:** `src/stores/synchronisation.ts`

```typescript
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
        titre: signalement.titre,
        description: signalement.description,
        statut: signalement.statut,
        date_signalement: convertirDate(signalement.date_signalement),
        date_debut: signalement.date_debut ? convertirDate(signalement.date_debut) : null,
        date_fin: signalement.date_fin ? convertirDate(signalement.date_fin) : null,
        surface_m2: signalement.surface_m2,
        budget: signalement.budget,
        entreprise: signalement.entreprise || null,
        latitude: signalement.latitude,
        longitude: signalement.longitude,
        type_probleme: signalement.type_probleme,
        type_route: signalement.type_route,
        firebase_id: signalement.firebase_id || signalement.id
      }
      
      const response = await axios.post(`${API_URL}/problemes`, payload)
      
      console.log('✅ Signalement envoyé vers PostgreSQL:', response.data)
      return response.data
      
    } catch (err: any) {
      console.error('❌ Erreur envoi PostgreSQL:', err)
      throw err
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
      
      // Étape 2: Envoyer vers PostgreSQL
      syncProgress.value = { total: signalementsFirebaseData.length, current: 0, etape: 'Envoi vers PostgreSQL' }
      
      for (let i = 0; i < signalementsFirebaseData.length; i++) {
        const signalement = signalementsFirebaseData[i]
        syncProgress.value.current = i + 1
        
        try {
          // Vérifier si existe déjà dans PostgreSQL
          const exists = await verifierExistencePostgreSQL(signalement.firebase_id!)
          
          if (!exists) {
            await envoyerVersPostgreSQL(signalement)
            syncStats.value.envoyes++
          } else {
            console.log(`⏭️ Signalement ${signalement.titre} existe déjà dans PostgreSQL`)
          }
          
        } catch (err: any) {
          console.error(`❌ Erreur pour ${signalement.titre}:`, err)
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
      
      console.log('✅ Synchronisation terminée:', syncStats.value)
      
      return {
        success: true,
        stats: syncStats.value
      }
      
    } catch (err: any) {
      console.error('❌ Erreur synchronisation:', err)
      error.value = err.message
      return {
        success: false,
        erreur: err.message
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
    } catch (err) {
      // Si l'endpoint n'existe pas, on considère que ça n'existe pas
      return false
    }
  }

  // Convertir les dates Firebase en format ISO
  const convertirDate = (date: any): string => {
    if (!date) return new Date().toISOString()
    
    // Si c'est un Timestamp Firebase
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toISOString()
    }
    
    // Si c'est déjà une Date
    if (date instanceof Date) {
      return date.toISOString()
    }
    
    // Si c'est une string
    if (typeof date === 'string') {
      return new Date(date).toISOString()
    }
    
    return new Date().toISOString()
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
```

---

## 2. Composant Bouton de Synchronisation

**Fichier:** `src/components/SyncButton.vue`

```vue
<template>
  <div class="sync-container">
    <button 
      @click="handleSync"
      :disabled="isLoading"
      class="sync-button"
      :class="{ 'loading': isLoading, 'need-sync': needsSync }"
    >
      <span class="icon">
        <svg v-if="!isLoading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span v-else class="spinner-icon">⟳</span>
      </span>
      <span>{{ buttonText }}</span>
      <span v-if="needsSync && !isLoading" class="badge-sync">{{ signalementsNonSyncs.length }}</span>
    </button>

    <!-- Barre de progression -->
    <div v-if="isLoading && syncProgress.total > 0" class="sync-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <p class="progress-text">
        {{ syncProgress.etape }} ({{ syncProgress.current }}/{{ syncProgress.total }})
      </p>
    </div>

    <!-- Message de résultat -->
    <transition name="fade">
      <div v-if="message" class="sync-message" :class="messageType">
        <div class="message-content">
          <span class="message-icon">{{ messageIcon }}</span>
          <div v-html="message"></div>
        </div>
        <button @click="message = ''" class="close-btn">×</button>
      </div>
    </transition>

    <!-- Statistiques -->
    <div v-if="showStats && syncStats && (syncStats.recus > 0 || syncStats.envoyes > 0)" class="sync-stats">
      <div class="stat">
        <span class="label">📥 Reçus de Firebase:</span>
        <span class="value">{{ syncStats.recus }}</span>
      </div>
      <div class="stat">
        <span class="label">📤 Envoyés vers PostgreSQL:</span>
        <span class="value">{{ syncStats.envoyes }}</span>
      </div>
      <div v-if="syncStats.erreurs && syncStats.erreurs.length > 0" class="stat error">
        <span class="label">❌ Erreurs:</span>
        <span class="value">{{ syncStats.erreurs.length }}</span>
      </div>
    </div>

    <!-- Dernière synchronisation -->
    <div v-if="lastSync" class="last-sync">
      <span class="icon">🕐</span>
      Dernière sync: {{ formatLastSync(lastSync) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSynchronisationStore } from '@/stores/synchronisation'

const props = defineProps({
  showStats: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['syncComplete', 'syncError'])

const syncStore = useSynchronisationStore()
const { 
  isLoading, 
  error, 
  syncStats, 
  lastSync, 
  syncProgress,
  signalementsNonSyncs,
  needsSync
} = storeToRefs(syncStore)

const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

const buttonText = computed(() => {
  if (isLoading.value) return 'Synchronisation...'
  if (needsSync.value) return 'Synchroniser maintenant'
  return 'Synchroniser'
})

const messageIcon = computed(() => {
  return messageType.value === 'success' ? '✅' : messageType.value === 'error' ? '❌' : 'ℹ️'
})

const progressPercent = computed(() => {
  if (!syncProgress.value.total) return 0
  return Math.round((syncProgress.value.current / syncProgress.value.total) * 100)
})

const handleSync = async () => {
  message.value = ''
  
  try {
    const resultat = await syncStore.synchroniser()
    
    if (resultat.success) {
      messageType.value = 'success'
      message.value = `
        <strong>Synchronisation réussie!</strong><br>
        📥 ${resultat.stats.recus} signalements récupérés de Firebase<br>
        📤 ${resultat.stats.envoyes} signalements envoyés vers PostgreSQL
        ${resultat.stats.erreurs.length > 0 ? `<br>⚠️ ${resultat.stats.erreurs.length} erreur(s)` : ''}
      `
      
      emit('syncComplete', resultat)
    } else {
      messageType.value = 'error'
      message.value = `<strong>Erreur de synchronisation</strong><br>${resultat.erreur}`
      emit('syncError', resultat.erreur)
    }
    
    // Effacer le message après 8 secondes
    setTimeout(() => {
      message.value = ''
    }, 8000)
    
  } catch (err: any) {
    messageType.value = 'error'
    message.value = `<strong>Erreur</strong><br>${err.message}`
    emit('syncError', err.message)
  }
}

const formatLastSync = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `Il y a ${minutes} min`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  
  return new Date(date).toLocaleString('fr-FR')
}
</script>

<style scoped>
.sync-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sync-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  position: relative;
}

.sync-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.sync-button:active:not(:disabled) {
  transform: translateY(0);
}

.sync-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.sync-button.need-sync {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 4px 20px rgba(255, 193, 7, 0.6); }
}

.sync-button .icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-icon {
  display: inline-block;
  animation: spin 1s linear infinite;
  font-size: 20px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.badge-sync {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(255, 71, 87, 0.5);
}

.sync-progress {
  margin-top: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.progress-text {
  margin-top: 6px;
  font-size: 13px;
  color: #6c757d;
  text-align: center;
}

.sync-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.sync-message.success {
  background-color: #d4edda;
  color: #155724;
  border-left: 4px solid #28a745;
}

.sync-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border-left: 4px solid #dc3545;
}

.message-content {
  display: flex;
  gap: 12px;
  flex: 1;
}

.message-icon {
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  padding: 0 4px;
}

.close-btn:hover {
  opacity: 1;
}

.sync-stats {
  display: flex;
  gap: 1.5rem;
  padding: 14px;
  background-color: #f8f9fa;
  border-radius: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat .label {
  font-size: 13px;
  color: #6c757d;
  font-weight: 500;
}

.stat .value {
  font-size: 20px;
  font-weight: 700;
  color: #212529;
}

.stat.error .value {
  color: #dc3545;
}

.last-sync {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6c757d;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

---

## 3. Intégration dans la Page Carte

**Fichier:** `src/views/CarteView.vue` (mise à jour)

```vue
<template>
  <div class="carte-container">
    <!-- Bouton de synchronisation en haut -->
    <div class="sync-header">
      <SyncButton 
        :show-stats="true"
        @sync-complete="handleSyncComplete"
        @sync-error="handleSyncError"
      />
    </div>

    <!-- Tableau de récapitulation -->
    <div class="dashboard-summary">
      <!-- Votre code existant... -->
    </div>

    <!-- Carte -->
    <div ref="mapContainer" class="map-container"></div>

    <!-- Loading overlay -->
    <div v-if="loading || syncLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ loading ? 'Chargement des données...' : 'Synchronisation...' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useProblemesStore } from '@/stores/problemes';
import { useSynchronisationStore } from '@/stores/synchronisation';
import SyncButton from '@/components/SyncButton.vue';
import type { ProblemeRoutier } from '@/types/probleme';

const problemesStore = useProblemesStore();
const { problemes, stats, loading } = storeToRefs(problemesStore);

const syncStore = useSynchronisationStore();
const { isLoading: syncLoading } = storeToRefs(syncStore);

const mapContainer = ref<HTMLDivElement | null>(null);
let map: maplibregl.Map | null = null;
const markers: maplibregl.Marker[] = [];

onMounted(async () => {
  initMap();
  await problemesStore.loadAllData();
  addMarkers();
});

function initMap() {
  // Votre code existant...
}

function addMarkers() {
  // Votre code existant...
}

// Gérer la fin de synchronisation
const handleSyncComplete = async (resultat: any) => {
  console.log('Synchronisation terminée:', resultat);
  
  // Recharger les données depuis PostgreSQL
  await problemesStore.loadAllData();
  
  // Rafraîchir la carte
  addMarkers();
}

const handleSyncError = (error: string) => {
  console.error('Erreur de synchronisation:', error);
}

// Vos fonctions existantes...
</script>

<style>
.sync-header {
  padding: 20px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 11;
  position: relative;
}

/* Votre CSS existant... */
</style>
```

---

## 4. Backend API (Laravel)

**Fichier:** `routes/api.php`

```php
<?php

use App\Http\Controllers\ProblemeRoutierController;

Route::prefix('problemes')->group(function () {
    Route::get('/', [ProblemeRoutierController::class, 'index']);
    Route::post('/', [ProblemeRoutierController::class, 'store']);
    Route::get('/{id}', [ProblemeRoutierController::class, 'show']);
    Route::put('/{id}', [ProblemeRoutierController::class, 'update']);
    Route::delete('/{id}', [ProblemeRoutierController::class, 'destroy']);
    
    // Route pour vérifier l'existence par firebase_id
    Route::get('/check/{firebase_id}', [ProblemeRoutierController::class, 'checkExists']);
});
```

**Fichier:** `app/Http/Controllers/ProblemeRoutierController.php`

```php
<?php

namespace App\Http\Controllers;

use App\Models\ProblemeRoutier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProblemeRoutierController extends Controller
{
    /**
     * Liste tous les problèmes
     */
    public function index()
    {
        $problemes = ProblemeRoutier::orderBy('date_signalement', 'desc')->get();
        return response()->json($problemes);
    }

    /**
     * Créer un nouveau problème
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titre' => 'required|string|max:150',
            'description' => 'required|string',
            'statut' => 'required|in:nouveau,en_cours,termine',
            'date_signalement' => 'required|date',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'surface_m2' => 'required|numeric|min:0',
            'budget' => 'required|numeric|min:0',
            'entreprise' => 'nullable|string|max:150',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'type_probleme' => 'required|in:nid_de_poule,fissure,affaissement,autre',
            'type_route' => 'required|in:pont,trottoir,route,piste_cyclable,autre',
            'firebase_id' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        // Vérifier si existe déjà par firebase_id
        if ($request->has('firebase_id')) {
            $existing = ProblemeRoutier::where('firebase_id', $request->firebase_id)->first();
            if ($existing) {
                return response()->json([
                    'message' => 'Problème déjà existant',
                    'data' => $existing
                ], 200);
            }
        }

        $probleme = ProblemeRoutier::create($request->all());

        return response()->json([
            'message' => 'Problème créé avec succès',
            'data' => $probleme
        ], 201);
    }

    /**
     * Afficher un problème spécifique
     */
    public function show($id)
    {
        $probleme = ProblemeRoutier::findOrFail($id);
        return response()->json($probleme);
    }

    /**
     * Mettre à jour un problème
     */
    public function update(Request $request, $id)
    {
        $probleme = ProblemeRoutier::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'titre' => 'sometimes|string|max:150',
            'description' => 'sometimes|string',
            'statut' => 'sometimes|in:nouveau,en_cours,termine',
            'date_signalement' => 'sometimes|date',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'surface_m2' => 'sometimes|numeric|min:0',
            'budget' => 'sometimes|numeric|min:0',
            'entreprise' => 'nullable|string|max:150',
            'latitude' => 'sometimes|numeric|between:-90,90',
            'longitude' => 'sometimes|numeric|between:-180,180',
            'type_probleme' => 'sometimes|in:nid_de_poule,fissure,affaissement,autre',
            'type_route' => 'sometimes|in:pont,trottoir,route,piste_cyclable,autre'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }

        $probleme->update($request->all());

        return response()->json([
            'message' => 'Problème mis à jour avec succès',
            'data' => $probleme
        ]);
    }

    /**
     * Supprimer un problème
     */
    public function destroy($id)
    {
        $probleme = ProblemeRoutier::findOrFail($id);
        $probleme->delete();

        return response()->json([
            'message' => 'Problème supprimé avec succès'
        ]);
    }

    /**
     * Vérifier si un problème existe par firebase_id
     */
    public function checkExists($firebase_id)
    {
        $exists = ProblemeRoutier::where('firebase_id', $firebase_id)->exists();
        
        return response()->json([
            'exists' => $exists
        ]);
    }
}
```

**Fichier:** `app/Models/ProblemeRoutier.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProblemeRoutier extends Model
{
    use HasFactory;

    protected $table = 'probleme_routier';
    protected $primaryKey = 'id_probleme';
    public $timestamps = false;

    protected $fillable = [
        'titre',
        'description',
        'statut',
        'date_signalement',
        'date_debut',
        'date_fin',
        'surface_m2',
        'budget',
        'entreprise',
        'latitude',
        'longitude',
        'type_probleme',
        'type_route',
        'firebase_id'
    ];

    protected $casts = [
        'surface_m2' => 'decimal:2',
        'budget' => 'decimal:2',
        'latitude' => 'decimal:6',
        'longitude' => 'decimal:6',
        'date_signalement' => 'date',
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];
}
```

---

## 5. Migration PostgreSQL

**Fichier:** `database/migrations/xxxx_add_firebase_id_to_probleme_routier.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('probleme_routier', function (Blueprint $table) {
            $table->string('firebase_id')->nullable()->unique()->after('type_route');
        });
    }

    public function down()
    {
        Schema::table('probleme_routier', function (Blueprint $table) {
            $table->dropColumn('firebase_id');
        });
    }
};
```

---

## 6. Règles Firebase Firestore

Dans la console Firebase, configurez les règles :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Collection signalements
    match /signalements/{signalementId} {
      // Tout le monde peut lire
      allow read: if true;
      
      // Tout le monde peut créer (pour le développement)
      // En production, ajouter l'authentification
      allow create: if true;
      
      // Seuls les utilisateurs authentifiés peuvent modifier/supprimer
      allow update, delete: if request.auth != null;
    }
  }
}
```

---

## Checklist de Déploiement

- [ ] Firebase configuré avec les bonnes clés
- [ ] Firestore Database activé
- [ ] Collection `signalements` créée
- [ ] Backend Laravel avec routes API
- [ ] Table PostgreSQL avec colonne `firebase_id`
- [ ] Migration exécutée
- [ ] Store Pinia `synchronisation` créé
- [ ] Composant `SyncButton` intégré
- [ ] CORS configuré sur le backend
- [ ] Variables d'environnement configurées

---

## Test du Système

1. **Ajouter un signalement dans Firebase** (via console)
2. **Cliquer sur "Synchroniser"** dans l'app
3. **Vérifier dans PostgreSQL** que les données sont arrivées
4. **Vérifier sur la carte** que les markers s'affichent

---

Votre système de synchronisation Firebase ↔ PostgreSQL est maintenant complet ! 🎉
