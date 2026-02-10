<!-- src/views/SignalementsView.vue - Page Gestionnaire -->
<template>
  <div class="manager-page">
    <!-- Header -->
    <header class="manager-header">
      <div class="header-content">
        <div class="header-left">
          <h1>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            Gestion des Signalements
          </h1>
          <p>Synchronisez, gérez et suivez les problèmes routiers</p>
        </div>
        <div class="header-right">
          <div v-if="lastSync" class="last-sync-badge">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Dernière sync: {{ formatDate(lastSync) }}
          </div>
        </div>
      </div>
    </header>

    <!-- Sync Section -->
    <section class="sync-section">
      <div class="sync-card">
        <div class="sync-info">
          <div class="sync-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </div>
          <div>
            <h3>Synchronisation Firebase</h3>
            <p>Récupérez les nouveaux signalements depuis Firebase vers PostgreSQL</p>
          </div>
        </div>
        <SyncButton
          :show-stats="true"
          @sync-complete="handleSyncComplete"
          @sync-error="handleSyncError"
        />
      </div>
    </section>

    <!-- Stats Cards -->
    <section class="stats-row">
      <div class="stat-card blue">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ totalSignalements }}</span>
          <span class="stat-label">Total signalements</span>
        </div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ countByStatut('nouveau') }}</span>
          <span class="stat-label">Nouveaux</span>
        </div>
      </div>
      <div class="stat-card yellow">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ countByStatut('en_cours') }}</span>
          <span class="stat-label">En cours</span>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="stat-content">
          <span class="stat-value">{{ countByStatut('termine') }}</span>
          <span class="stat-label">Terminés</span>
        </div>
      </div>
    </section>

    <!-- Filters -->
    <section class="filters-section">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Rechercher un signalement..."
        />
      </div>
      <div class="filter-group">
        <select v-model="filterStatut">
          <option value="">Tous les statuts</option>
          <option value="nouveau">Nouveau</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Terminé</option>
        </select>
        <select v-model="filterType">
          <option value="">Tous les types</option>
          <option value="nid_de_poule">Nid de poule</option>
          <option value="fissure">Fissure</option>
          <option value="affaissement">Affaissement</option>
          <option value="autre">Autre</option>
        </select>
      </div>
    </section>

    <!-- Signalements List -->
    <section class="signalements-section">
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Chargement des signalements...</p>
      </div>

      <div v-else-if="filteredSignalements.length === 0" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>Aucun signalement trouvé</h3>
        <p>Synchronisez avec Firebase pour récupérer les signalements</p>
      </div>

      <div v-else class="signalements-grid">
        <div
          v-for="signalement in filteredSignalements"
          :key="signalement.id"
          class="signalement-card"
          :class="`border-${signalement.statut}`"
        >
          <div class="card-header">
            <span class="type-badge" :class="`type-${signalement.type_probleme}`">
              {{ formatType(signalement.type_probleme) }}
            </span>
            <span class="statut-badge" :class="`statut-${signalement.statut}`">
              {{ formatStatut(signalement.statut) }}
            </span>
          </div>

          <h3 class="card-title">{{ signalement.titre }}</h3>
          <p class="card-description">{{ signalement.description }}</p>

          <div class="card-details">
            <div class="detail-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{{ signalement.latitude?.toFixed(4) }}, {{ signalement.longitude?.toFixed(4) }}</span>
            </div>
            <div class="detail-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{{ formatDate(signalement.date_signalement) }}</span>
            </div>
            <div class="detail-item" v-if="signalement.surface_m2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              </svg>
              <span>{{ signalement.surface_m2 }} m²</span>
            </div>
            <div class="detail-item" v-if="signalement.budget">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              <span>{{ formatCurrency(signalement.budget) }}</span>
            </div>
          </div>

          <div class="card-actions">
            <label class="status-selector">
              <span>Statut:</span>
              <select 
                :value="signalement.statut"
                @change="updateStatut(signalement.id, ($event.target as HTMLSelectElement).value)"
                :class="`select-${signalement.statut}`"
              >
                <option value="nouveau">Nouveau</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
              </select>
            </label>
            <button 
              @click="openEditModal(signalement)"
              class="btn-edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Modifier
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Edit Modal -->
    <div v-if="editingSignalement" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Modifier le signalement</h2>
          <button @click="closeEditModal" class="modal-close">×</button>
        </div>
        <form @submit.prevent="saveChanges" class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Titre</label>
              <input v-model="editForm.titre" required />
            </div>
            <div class="form-group">
              <label>Statut</label>
              <select v-model="editForm.statut" required>
                <option value="nouveau">Nouveau</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="editForm.description" rows="3" required></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Entreprise assignée</label>
              <input v-model="editForm.entreprise" placeholder="Non assignée" />
            </div>
            <div class="form-group">
              <label>Budget (Ar)</label>
              <input type="number" v-model.number="editForm.budget" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Date début travaux</label>
              <input type="date" v-model="editForm.date_debut" />
            </div>
            <div class="form-group">
              <label>Date fin travaux</label>
              <input type="date" v-model="editForm.date_fin" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="closeEditModal" class="btn-cancel">Annuler</button>
            <button type="submit" class="btn-save" :disabled="saving">
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSynchronisationStore } from '@/stores/synchronisation'
import SyncButton from '@/components/SyncButton.vue'
import apiClient from '@/services/api'

const syncStore = useSynchronisationStore()
const { isLoading, lastSync } = storeToRefs(syncStore)

// Local state
const signalements = ref<any[]>([])
const searchQuery = ref('')
const filterStatut = ref('')
const filterType = ref('')
const editingSignalement = ref<any>(null)
const editForm = ref<any>({})
const saving = ref(false)

// Computed
const totalSignalements = computed(() => signalements.value.length)

const filteredSignalements = computed(() => {
  return signalements.value.filter(s => {
    const matchSearch = !searchQuery.value || 
      s.titre?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchStatut = !filterStatut.value || s.statut === filterStatut.value
    const matchType = !filterType.value || s.type_probleme === filterType.value
    return matchSearch && matchStatut && matchType
  })
})

const countByStatut = (statut: string) => {
  return signalements.value.filter(s => s.statut === statut).length
}

// Load signalements from PostgreSQL
const loadSignalements = async () => {
  try {
    const response = await apiClient.get('/problemes')
    signalements.value = response.data
    console.log('✅ Signalements chargés:', signalements.value.length)
  } catch (error) {
    console.error('Erreur chargement:', error)
  }
}

onMounted(() => {
  loadSignalements()
})

// Handlers
const handleSyncComplete = async () => {
  console.log('✅ Sync terminée, rechargement...')
  await loadSignalements()
}

const handleSyncError = (error: string) => {
  console.error('❌ Erreur sync:', error)
}

const updateStatut = async (id: number, newStatut: string) => {
  try {
    await apiClient.put(`/problemes/${id}`, { statut: newStatut })
    const item = signalements.value.find(s => s.id === id)
    if (item) item.statut = newStatut
    console.log('✅ Statut mis à jour')
  } catch (error) {
    console.error('Erreur update statut:', error)
  }
}

const openEditModal = (signalement: any) => {
  editingSignalement.value = signalement
  editForm.value = { ...signalement }
}

const closeEditModal = () => {
  editingSignalement.value = null
  editForm.value = {}
}

const saveChanges = async () => {
  saving.value = true
  try {
    await apiClient.put(`/problemes/${editingSignalement.value.id}`, editForm.value)
    const index = signalements.value.findIndex(s => s.id === editingSignalement.value.id)
    if (index > -1) {
      signalements.value[index] = { ...signalements.value[index], ...editForm.value }
    }
    closeEditModal()
    console.log('✅ Signalement mis à jour')
  } catch (error) {
    console.error('Erreur save:', error)
  } finally {
    saving.value = false
  }
}

// Formatters
const formatDate = (date: any) => {
  if (!date) return 'N/A'
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleDateString('fr-FR')
}

const formatStatut = (statut: string) => {
  const labels: Record<string, string> = {
    nouveau: 'Nouveau',
    en_cours: 'En cours',
    termine: 'Terminé'
  }
  return labels[statut] || statut
}

const formatType = (type: string) => {
  const labels: Record<string, string> = {
    nid_de_poule: 'Nid de poule',
    fissure: 'Fissure',
    affaissement: 'Affaissement',
    autre: 'Autre'
  }
  return labels[type] || type
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' Ar'
}
</script>

<style scoped>
/* Manager Page */
.manager-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 2rem;
}

/* Header */
.manager-header {
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  color: white;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  margin: 0 0 0.5rem 0;
}

.header-left p {
  margin: 0;
  opacity: 0.8;
}

.last-sync-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

/* Sync Section */
.sync-section {
  margin-bottom: 2rem;
}

.sync-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.sync-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sync-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.sync-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  color: #1e3a5f;
}

.sync-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  border-left: 4px solid;
}

.stat-card.blue { border-color: #3b82f6; }
.stat-card.red { border-color: #ef4444; }
.stat-card.yellow { border-color: #f59e0b; }
.stat-card.green { border-color: #10b981; }

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card.blue .stat-icon { background: #eff6ff; color: #3b82f6; }
.stat-card.red .stat-icon { background: #fef2f2; color: #ef4444; }
.stat-card.yellow .stat-icon { background: #fffbeb; color: #f59e0b; }
.stat-card.green .stat-icon { background: #ecfdf5; color: #10b981; }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a5f;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Filters */
.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.search-box svg {
  color: #9ca3af;
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
}

.filter-group {
  display: flex;
  gap: 0.75rem;
}

.filter-group select {
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 12px;
  background: white;
  font-size: 0.875rem;
  color: #374151;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

/* Signalements Grid */
.signalements-section {
  min-height: 300px;
}

.signalements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.signalement-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border-left: 5px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;
}

.signalement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.signalement-card.border-nouveau { border-color: #ef4444; }
.signalement-card.border-en_cours { border-color: #f59e0b; }
.signalement-card.border-termine { border-color: #10b981; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.type-badge, .statut-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-badge {
  background: #eff6ff;
  color: #3b82f6;
}

.type-badge.type-nid_de_poule { background: #fef3c7; color: #d97706; }
.type-badge.type-fissure { background: #fce7f3; color: #db2777; }
.type-badge.type-affaissement { background: #f3e8ff; color: #9333ea; }

.statut-badge.statut-nouveau { background: #fef2f2; color: #dc2626; }
.statut-badge.statut-en_cours { background: #fffbeb; color: #d97706; }
.statut-badge.statut-termine { background: #ecfdf5; color: #059669; }

.card-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #1e3a5f;
}

.card-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #6b7280;
}

.detail-item svg {
  color: #9ca3af;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.status-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.status-selector select {
  padding: 0.35rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
}

.select-nouveau { border-color: #fca5a5; }
.select-en_cours { border-color: #fcd34d; }
.select-termine { border-color: #6ee7b7; }

.btn-edit {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-edit:hover {
  opacity: 0.9;
}

/* Loading & Empty States */
.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state svg {
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e3a5f;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
}

.modal-close:hover {
  background: #e5e7eb;
}

.modal-body {
  padding: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  margin-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-save {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .manager-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .sync-card {
    flex-direction: column;
    text-align: center;
  }
  
  .sync-info {
    flex-direction: column;
  }
  
  .signalements-grid {
    grid-template-columns: 1fr;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .card-actions {
    flex-direction: column;
  }
}
</style>
