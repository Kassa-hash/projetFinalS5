<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>Dashboard Manager</h1>
      <p>Bienvenue, Administrateur {{ authStore.user?.name }} !</p>
    </div>

    <div class="dashboard-content">
      <div class="card">
        <h2>Contrôle d'Administration</h2>
        <div class="admin-info">
          <p>Vous avez accès aux fonctionnalités d'administration :</p>
          <ul class="admin-features">
            <li>✅ Gérer les utilisateurs</li>
            <li>✅ Consulter les statistiques globales</li>
            <li>✅ Contrôler les accès</li>
            <li>✅ Gérer les cartes système</li>
            <li>✅ Administrer les permissions</li>
          </ul>
        </div>
      </div>

      <div class="card">
        <h2>Profil Administrateur</h2>
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
            <label>Rôle:</label>
            <span class="role-badge admin">{{ authStore.user?.role }}</span>
          </div>
          <div class="info-item">
            <label>Téléphone:</label>
            <span>{{ authStore.user?.phone || 'Non fourni' }}</span>
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
        <h2>Statistiques Système</h2>
        <div class="stats-grid">
          <div class="stat">
            <div class="stat-number">156</div>
            <div class="stat-label">Utilisateurs Totaux</div>
          </div>
          <div class="stat">
            <div class="stat-number">42</div>
            <div class="stat-label">Managers</div>
          </div>
          <div class="stat">
            <div class="stat-number">89</div>
            <div class="stat-label">Cartes Actives</div>
          </div>
          <div class="stat">
            <div class="stat-number">12</div>
            <div class="stat-label">Incidents</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>Actions Rapides</h2>
        <div class="actions-grid">
          <button class="action-btn">
            <span class="btn-icon">👥</span>
            Gérer les Utilisateurs
          </button>
          <button class="action-btn">
            <span class="btn-icon">🗺️</span>
            Gérer les Cartes
          </button>
          <button class="action-btn">
            <span class="btn-icon">📊</span>
            Consulter Rapports
          </button>
          <button class="action-btn">
            <span class="btn-icon">⚙️</span>
            Paramètres Système
          </button>
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

.admin-info p {
  color: #555;
  margin-bottom: 1rem;
  font-weight: 500;
}

.admin-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.admin-features li {
  color: #333;
  font-size: 1rem;
  padding: 0.5rem 0;
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

.role-badge.admin {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: 600;
}

.locked {
  color: #c33;
  font-weight: 600;
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

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
}

.btn-icon {
  font-size: 1.5rem;
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

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
