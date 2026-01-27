<!-- src/views/SignalementsView.vue -->
<template>
  <div class="signalements-page">
    <header class="page-header">
      <h1>Gestion des Signalements</h1>
      <div class="header-actions">
        <span v-if="lastSync" class="last-sync">
          Dernière sync: {{ formatDate(lastSync) }}
        </span>
        <span v-if="needsSync" class="badge badge-warning">
          {{ signalementsNonSyncs.length }} à synchroniser
        </span>
      </div>
    </header>

    <!-- Bouton de synchronisation -->
    <SyncButton
      :donnees-locales="donneesLocales"
      :show-stats="true"
      @sync-complete="handleSyncComplete"
      @sync-error="handleSyncError"
    />

    <!-- Formulaire d'ajout -->
    <div class="form-section">
      <h2>Ajouter un signalement</h2>
      <form @submit.prevent="handleSubmit" class="signalement-form">
        <div class="form-group">
          <label for="type">Type</label>
          <select v-model="form.type" id="type" required>
            <option value="">Sélectionner...</option>
            <option value="incident">Incident</option>
            <option value="accident">Accident</option>
            <option value="maintenance">Maintenance</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea
            v-model="form.description"
            id="description"
            rows="4"
            required
            placeholder="Décrivez le signalement..."
          ></textarea>
        </div>

        <div class="form-group">
          <label for="statut">Statut</label>
          <select v-model="form.statut" id="statut" required>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="resolu">Résolu</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary">
          Ajouter
        </button>
      </form>
    </div>

    <!-- Liste des signalements -->
    <div class="signalements-section">
      <h2>Signalements en ligne ({{ totalSignalements }})</h2>
      
      <div v-if="isLoading" class="loading">
        <span class="spinner">🔄</span>
        Chargement...
      </div>

      <div v-else-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <div v-else-if="signalements.length === 0" class="empty-state">
        Aucun signalement pour le moment
      </div>

      <div v-else class="signalements-grid">
        <div
          v-for="signalement in signalements"
          :key="signalement.id"
          class="signalement-card"
        >
          <div class="card-header">
            <span class="badge" :class="`badge-${signalement.type}`">
              {{ signalement.type }}
            </span>
            <span class="statut" :class="`statut-${signalement.statut}`">
              {{ signalement.statut }}
            </span>
          </div>
          <p class="description">{{ signalement.description }}</p>
          <div class="card-footer">
            <span class="date">
              {{ formatDate(signalement.dateCreation) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Données locales -->
    <div class="locaux-section">
      <h2>Données locales ({{ donneesLocales.length }})</h2>
      
      <div v-if="donneesLocales.length === 0" class="empty-state">
        Aucune donnée locale
      </div>

      <div v-else class="signalements-list">
        <div
          v-for="donnee in donneesLocales"
          :key="donnee.id"
          class="signalement-item"
          :class="{ 'non-sync': !donnee.synced }"
        >
          <div class="item-content">
            <span class="type">{{ donnee.type }}</span>
            <span class="description">{{ donnee.description }}</span>
          </div>
          <div class="item-status">
            <span v-if="donnee.synced" class="synced">✅</span>
            <span v-else class="not-synced">⏳</span>
            <button
              @click="supprimerSignalement(donnee.id)"
              class="btn-delete"
              title="Supprimer"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSignalementsStore } from '@/stores/signalements'
import SyncButton from '@/components/SyncButton.vue'

const store = useSignalementsStore()

const {
  signalements,
  donneesLocales,
  isLoading,
  error,
  lastSync,
  signalementsNonSyncs,
  totalSignalements,
  needsSync
} = storeToRefs(store)

// Formulaire
const form = ref({
  type: '',
  description: '',
  statut: 'en_attente'
})

const handleSubmit = () => {
  store.ajouterSignalement({ ...form.value })
  
  // Réinitialiser le formulaire
  form.value = {
    type: '',
    description: '',
    statut: 'en_attente'
  }
}

const handleSyncComplete = (signalements) => {
  console.log('Synchronisation terminée:', signalements)
}

const handleSyncError = (error) => {
  console.error('Erreur de synchronisation:', error)
}

const formatDate = (date) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.signalements-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e9ecef;
}

.page-header h1 {
  margin: 0;
  color: #212529;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.last-sync {
  font-size: 14px;
  color: #6c757d;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-warning {
  background-color: #fff3cd;
  color: #856404;
}

.badge-incident { background-color: #f8d7da; color: #721c24; }
.badge-accident { background-color: #fff3cd; color: #856404; }
.badge-maintenance { background-color: #d1ecf1; color: #0c5460; }
.badge-autre { background-color: #e2e3e5; color: #383d41; }

.form-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.form-section h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.signalement-form {
  display: grid;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #495057;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5568d3;
}

.signalements-section,
.locaux-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.signalements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.signalement-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.statut {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.statut-en_attente { background-color: #fff3cd; color: #856404; }
.statut-en_cours { background-color: #d1ecf1; color: #0c5460; }
.statut-resolu { background-color: #d4edda; color: #155724; }

.description {
  color: #495057;
  margin-bottom: 1rem;
}

.card-footer {
  display: flex;
  justify-content: flex-end;
}

.date {
  font-size: 12px;
  color: #6c757d;
}

.signalements-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.signalement-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.signalement-item.non-sync {
  border-left: 4px solid #ffc107;
}

.item-content {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.item-content .type {
  font-weight: 600;
  color: #667eea;
}

.item-status {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-delete:hover {
  opacity: 1;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-message {
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  border-radius: 6px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}
</style>