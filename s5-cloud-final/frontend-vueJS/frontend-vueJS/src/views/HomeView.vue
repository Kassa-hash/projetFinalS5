<template>
  <div class="home-container">
    <div class="hero-section">
      <h1>Bienvenue dans Offline Map</h1>
      <p>Une application de cartographie hors ligne avec authentification Firebase + PostgreSQL</p>
      
      <div v-if="!authStore.isAuthenticated" class="cta-buttons">
        <router-link to="/login" class="btn btn-primary">Se connecter</router-link>
        <router-link to="/register" class="btn btn-secondary">S'inscrire</router-link>
      </div>

      <div v-else class="cta-buttons">
        <router-link :to="'/dashboard/' + authStore.userRole" class="btn btn-primary">
          Aller au Dashboard
        </router-link>
      </div>
    </div>

    <div class="features-section">
      <h2>Nos Fonctionnalités</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🗺️</div>
          <h3>Cartographie Hors Ligne</h3>
          <p>Consultez les cartes sans connexion Internet</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🔐</div>
          <h3>Authentification Sécurisée</h3>
          <p>Connexion Firebase avec fallback PostgreSQL</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">👥</div>
          <h3>Rôles Utilisateurs</h3>
          <p>Visiteur, Utilisateur, Manager avec permissions</p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🌐</div>
          <h3>Synchronisation Cloud</h3>
          <p>Données synchronisées entre Firebase et PostgreSQL</p>
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
.home-container {
  max-width: 100%;
  margin: 0;
}

.hero-section {
  text-align: center;
  padding: 3rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 0;
  color: white;
  margin-bottom: 2rem;
}

.hero-section h1 {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.hero-section p {
  font-size: 1.3rem;
  margin-bottom: 2rem;
  opacity: 0.95;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 15px 40px;
  border-radius: 5px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s;
  border: 2px solid white;
  display: inline-block;
  cursor: pointer;
}

.btn-primary {
  background: white;
  color: #667eea;
  border-color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background: transparent;
  color: white;
  border-color: white;
}

.btn-secondary:hover {
  background: white;
  color: #667eea;
}

.features-section {
  padding: 2rem 5%;
  max-width: 100%;
  margin: 0;
}

.features-section h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
  gap: 2rem;
}

.feature-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.feature-card p {
  color: #666;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 2rem;
  }

  .hero-section h1 {
    font-size: 2rem;
  }

  .hero-section p {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 1.5rem 1rem;
  }

  .hero-section h1 {
    font-size: 1.5rem;
  }

  .hero-section p {
    font-size: 0.9rem;
  }

  .btn {
    padding: 12px 30px;
    font-size: 0.95rem;
  }

  .features-section {
    padding: 1.5rem 3%;
  }

  .features-grid {
    gap: 1rem;
  }

  .feature-card {
    padding: 1.5rem;
  }
}
</style>
