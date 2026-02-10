<style scoped>

/* ============================= */
/* 🌍 PAGE GLOBALE */
/* ============================= */
.signalements-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: #f1f3f5;
  color: #212529;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/* ============================= */
/* 🧭 HEADER */
/* ============================= */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.page-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #1c1f26;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.last-sync {
  font-size: 13px;
  color: #495057;
  background: #e9ecef;
  padding: 6px 10px;
  border-radius: 6px;
}

/* ============================= */
/* 🏷️ BADGES */
/* ============================= */
.badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-warning {
  background: #fff3cd;
  color: #664d03;
}

.badge-type {
  background: #0d6efd;
  color: #ffffff;
}

/* ============================= */
/* 📝 FORMULAIRE */
/* ============================= */
.form-section {
  background: #ffffff;
  padding: 2rem;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.form-section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #212529;
}

.signalement-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 6px;
  font-weight: 600;
  color: #343a40;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid #dee2e6;
  font-size: 14px;
  background: #ffffff;
  color: #212529;
}

.form-group textarea {
  resize: vertical;
  min-height: 90px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.15);
}

/* ============================= */
/* 🔘 BOUTONS */
/* ============================= */
.btn {
  padding: 0.8rem 1.6rem;
  border-radius: 10px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #0d6efd, #0b5ed7);
  color: white;
  grid-column: 1 / -1;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(13, 110, 253, 0.35);
}

/* ============================= */
/* 📦 SECTIONS */
/* ============================= */
.signalements-section,
.locaux-section {
  background: #ffffff;
  padding: 2rem;
  border-radius: 14px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}

.signalements-section h2,
.locaux-section h2 {
  margin-bottom: 1.5rem;
  font-weight: 700;
}

/* ============================= */
/* 🧱 CARTES */
/* ============================= */
.signalements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.signalement-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 1.5rem;
  border-left: 6px solid #0d6efd;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.signalement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.signalement-card h3 {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  color: #212529;
}

.description {
  font-size: 14px;
  color: #495057;
  line-height: 1.5;
}

/* ============================= */
/* 📌 STATUT */
/* ============================= */
.statut {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.statut-nouveau {
  background: #fff3cd;
  color: #664d03;
}

.statut-en_cours {
  background: #cff4fc;
  color: #055160;
}

.statut-termine {
  background: #d1e7dd;
  color: #0f5132;
}

/* ============================= */
/* 📅 FOOTER */
/* ============================= */
.card-footer {
  margin-top: 1rem;
  font-size: 13px;
  color: #495057;
}

/* ============================= */
/* 📭 ÉTATS */
/* ============================= */
.loading,
.empty-state,
.error-message {
  padding: 2rem;
  text-align: center;
  font-weight: 600;
}

.loading {
  color: #0d6efd;
}

.empty-state {
  color: #6c757d;
}

.error-message {
  background: #f8d7da;
  color: #842029;
  border-radius: 8px;
}

</style>
<!-- src/views/SignalementsView.vue -->
<template>
  <div class="signalements-page">
    <header class="page-header">
      <h1>Gestion des Signalements Routiers</h1>
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

    <!-- Formulaire -->
    <div class="form-section">
      <h2>Ajouter un problème routier</h2>

      <form @submit.prevent="handleSubmit" class="signalement-form">
        <div class="form-group">
          <label>Titre</label>
          <input v-model="form.titre" required />
        </div>

        <div class="form-group">
          <label>Type de problème</label>
          <select v-model="form.type_probleme" required>
            <option value="">Sélectionner...</option>
            <option value="nid_de_poule">Nid de poule</option>
            <option value="fissure">Fissure</option>
            <option value="route_degradee">Route dégradée</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" rows="4" required />
        </div>

        <div class="form-group">
          <label>Statut</label>
          <select v-model="form.statut">
            <option value="nouveau">Nouveau</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
        </div>

        <div class="form-group">
          <label>Latitude</label>
          <input type="number" step="any" v-model.number="form.latitude" required />
        </div>

        <div class="form-group">
          <label>Longitude</label>
          <input type="number" step="any" v-model.number="form.longitude" required />
        </div>

        <button class="btn btn-primary">Ajouter</button>
      </form>
    </div>

    <!-- Liste Firestore -->
    <div class="signalements-section">
      <h2>Signalements en ligne ({{ totalSignalements }})</h2>

      <div v-if="isLoading" class="loading">Chargement...</div>
      <div v-else-if="signalements.length === 0" class="empty-state">
        Aucun signalement
      </div>

      <div v-else class="signalements-grid">
        <div
          v-for="s in signalements"
          :key="s.id"
          class="signalement-card"
        >
          <div class="card-header">
            <span class="badge badge-type">
              {{ s.type_probleme }}
            </span>
            <span class="statut" :class="`statut-${s.statut}`">
              {{ s.statut }}
            </span>
          </div>

          <h3>{{ s.titre }}</h3>
          <p class="description">{{ s.description }}</p>

          <div class="card-footer">
            📍 {{ s.latitude }}, {{ s.longitude }} <br />
            🕒 {{ formatDate(s.date_signalement) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
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
  needsSync,
  source
} = storeToRefs(store)

const form = ref({
  titre: '',
  description: '',
  type_probleme: '',
  statut: 'nouveau',
  latitude: null,
  longitude: null
})

onMounted(async () => {
  console.log('📍 SignalementsView montée - Récupération des signalements...')
  try {
    await store.recupererSignalements()
    console.log(`✅ ${signalements.value.length} signalements chargés depuis ${source.value}`)
  } catch (err) {
    console.error('❌ Erreur lors du chargement:', err)
  }
})

const handleSubmit = () => {
  store.ajouterSignalement({
    ...form.value,
    date_signalement: new Date(),
    synced: false
  })

  form.value = {
    titre: '',
    description: '',
    type_probleme: '',
    statut: 'nouveau',
    latitude: null,
    longitude: null
  }
}

const formatDate = (date) => {
  if (!date) return ''
  const d = date.toDate ? date.toDate() : new Date(date)
  return d.toLocaleString('fr-FR')
}

const handleSyncComplete = () => {
  console.log('✅ Sync Firebase terminée')
}

const handleSyncError = (e) => {
  console.error('❌ Erreur Firebase', e)
}
</script>
