<!-- src/components/FirebaseDataViewer.vue -->
<template>
  <div class="firebase-viewer">
    <div class="header">
      <h2>📊 Données Firebase</h2>
      <button @click="chargerDonnees" :disabled="isLoading" class="btn-refresh">
        {{ isLoading ? '⏳ Chargement...' : '🔄 Actualiser' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <div v-if="isLoading" class="loading">
      <p>Chargement des données Firebase...</p>
    </div>

    <div v-else-if="signalements.length === 0" class="empty-state">
      <p>📭 Aucun signalement dans Firebase</p>
    </div>

    <div v-else class="signalements-list">
      <div class="stats">
        <p><strong>Total :</strong> {{ signalements.length }} signalement(s)</p>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Firebase ID</th>
              <th>Titre</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Type Problème</th>
              <th>Type Route</th>
              <th>Surface (m²)</th>
              <th>Budget (€)</th>
              <th>Date Signalement</th>
              <th>Coordonnées</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sig in signalements" :key="sig.id">
              <td><code>{{ sig.firebase_id || sig.id }}</code></td>
              <td>{{ sig.titre }}</td>
              <td class="description">{{ sig.description }}</td>
              <td>
                <span :class="['badge', `badge-${sig.statut}`]">
                  {{ sig.statut }}
                </span>
              </td>
              <td>{{ sig.type_probleme }}</td>
              <td>{{ sig.type_route }}</td>
              <td>{{ sig.surface_m2 }}</td>
              <td>{{ sig.budget }}</td>
              <td>{{ formatDate(sig.date_signalement) }}</td>
              <td>
                <small>
                  {{ sig.latitude.toFixed(6) }}, {{ sig.longitude.toFixed(6) }}
                </small>
              </td>
              <td>
                <button 
                  @click="envoyerVersPostgres(sig)" 
                  :disabled="isLoadingItem[sig.id || '']"
                  class="btn-sync"
                >
                  {{ isLoadingItem[sig.id || ''] ? '⏳' : '📤' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="actions">
        <button @click="synchroniserTout" :disabled="isSyncing" class="btn-sync-all">
          {{ isSyncing ? '⏳ Synchronisation...' : '🔄 Synchroniser tout vers PostgreSQL' }}
        </button>
      </div>

      <!-- Résultats de synchronisation -->
      <div v-if="syncResults.length > 0" class="sync-results">
        <h3>📋 Résultats de synchronisation</h3>
        <div v-for="(result, index) in syncResults" :key="index" :class="['result-item', result.success ? 'success' : 'error']">
          <span>{{ result.titre }}</span>
          <span>{{ result.success ? '✅ Succès' : `❌ ${result.error}` }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useSynchronisationStore } from '@/stores/synchronisation'
import type { SignalementFirebase } from '@/stores/synchronisation'

const store = useSynchronisationStore()
const signalements = ref<SignalementFirebase[]>([])
const isLoading = ref(false)
const isSyncing = ref(false)
const error = ref<string | null>(null)
const isLoadingItem = reactive<Record<string, boolean>>({})
const syncResults = ref<Array<{ titre: string; success: boolean; error?: string }>>([])

const chargerDonnees = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    signalements.value = await store.recupererDepuisFirebase()
    console.log('✅ Données chargées:', signalements.value.length)
  } catch (err: any) {
    error.value = err.message
    console.error('❌ Erreur:', err)
  } finally {
    isLoading.value = false
  }
}

const formatDate = (date: any): string => {
  if (!date) return 'N/A'
  
  try {
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('fr-FR')
    }
    if (date instanceof Date) {
      return date.toLocaleDateString('fr-FR')
    }
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('fr-FR')
    }
    return 'N/A'
  } catch {
    return 'N/A'
  }
}

const envoyerVersPostgres = async (sig: SignalementFirebase) => {
  const id = sig.id || sig.firebase_id || ''
  isLoadingItem[id] = true
  
  try {
    await store.envoyerVersPostgreSQL(sig)
    syncResults.value.push({
      titre: sig.titre,
      success: true
    })
    console.log('✅ Envoyé:', sig.titre)
  } catch (err: any) {
    syncResults.value.push({
      titre: sig.titre,
      success: false,
      error: err.message
    })
    console.error('❌ Erreur:', err)
  } finally {
    isLoadingItem[id] = false
  }
}

const synchroniserTout = async () => {
  isSyncing.value = true
  syncResults.value = []
  
  for (const sig of signalements.value) {
    await envoyerVersPostgres(sig)
  }
  
  isSyncing.value = false
}

onMounted(() => {
  chargerDonnees()
})
</script>

<style scoped>
.firebase-viewer {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-refresh, .btn-sync, .btn-sync-all {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-refresh {
  background: #4CAF50;
  color: white;
}

.btn-sync {
  background: #2196F3;
  color: white;
  padding: 4px 8px;
}

.btn-sync-all {
  background: #FF9800;
  color: white;
  margin-top: 20px;
}

.btn-refresh:disabled, .btn-sync:disabled, .btn-sync-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.stats {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background: #f5f5f5;
  font-weight: 600;
}

.description {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.badge-nouveau {
  background: #e3f2fd;
  color: #1976d2;
}

.badge-en_cours {
  background: #fff3e0;
  color: #f57c00;
}

.badge-termine {
  background: #e8f5e9;
  color: #388e3c;
}

code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.actions {
  text-align: center;
}

.sync-results {
  margin-top: 30px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 4px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
}

.result-item.success {
  background: #e8f5e9;
}

.result-item.error {
  background: #ffebee;
}
</style>