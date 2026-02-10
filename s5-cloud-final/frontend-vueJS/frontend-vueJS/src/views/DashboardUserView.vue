<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>Dashboard Utilisateur</h1>
      <p>Bienvenue, {{ authStore.user?.name }} !</p>
    </div>

    <div class="dashboard-content">
      <div class="card">
        <h2>Informations Profil</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Nom:</label>
            <span>{{ authStore.user?.name }}</span>
          </div>
          <div class="info-item">
            <label>Email:</label>
            <span>{{ authStore.user?.email }}</span>
          </div>
          <div class="info-item">
            <label>Téléphone:</label>
            <span>{{ authStore.user?.phone || 'Non fourni' }}</span>
          </div>
          <div class="info-item">
            <label>Rôle:</label>
            <span class="role-badge">{{ authStore.user?.role }}</span>
          </div>
          <div class="info-item">
            <label>Statut Compte:</label>
            <span :class="{ 'locked': authStore.user?.account_lockout }">
              {{ authStore.user?.account_lockout ? '🔒 Verrouillé' : '✅ Actif' }}
            </span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Fonctionnalités Disponibles</h2>
        <ul class="features-list">
          <li>✅ Consulter les cartes hors ligne</li>
          <li>✅ Gérer vos marques et favoris</li>
          <li>✅ Synchroniser vos données</li>
          <li>✅ Profiter du support utilisateur</li>
        </ul>
      </div>

      <div class="card">
        <h2>Statistiques</h2>
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-number">42</div>
            <div class="stat-label">Cartes Consultées</div>
          </div>
          <div class="stat">
            <div class="stat-number">15</div>
            <div class="stat-label">Points de Repère</div>
          </div>
          <div class="stat">
            <div class="stat-number">8</div>
            <div class="stat-label">Collections</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
</script>

<style scoped>
.dashboard-container {
  max-width: 100%;
  margin: 0;
  padding: 2rem 5%;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 10px;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.dashboard-content {
  display: grid;
  gap: 2rem;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.card h2 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  border-bottom: 2px solid #667eea;
  padding-bottom: 1rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-item label {
  font-weight: 600;
  color: #667eea;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.info-item span {
  color: #333;
  font-size: 1rem;
}

.role-badge {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  width: fit-content;
}

.locked {
  color: #c33;
  font-weight: 600;
}

.features-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features-list li {
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
  color: #333;
  font-size: 1.05rem;
}

.features-list li:last-child {
  border-bottom: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.stat {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 2rem;
  }

  .dashboard-header h1 {
    font-size: 1.8rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
