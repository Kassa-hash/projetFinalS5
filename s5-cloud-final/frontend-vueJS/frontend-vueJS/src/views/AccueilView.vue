<template>
  <div class="accueil-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          Plateforme officielle
        </div>
        <h1 class="hero-title">
          Signalement et suivi des 
          <span class="highlight">problèmes routiers</span>
        </h1>
        <p class="hero-description">
          RouteFix Madagascar permet aux citoyens de signaler les dégradations routières 
          et aux gestionnaires de suivre l'avancement des travaux en temps réel.
        </p>
        <div class="hero-actions">
          <router-link to="/carte" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
            Voir la carte
          </router-link>
          <router-link to="/login" class="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Espace gestionnaire
          </router-link>
        </div>
      </div>
      <div class="hero-visual">
        <div class="map-preview">
          <div class="map-overlay">
            <div class="marker marker-1"></div>
            <div class="marker marker-2"></div>
            <div class="marker marker-3"></div>
            <div class="marker marker-4"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Signalements</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="stat-value">{{ stats.en_cours }}</div>
          <div class="stat-label">En cours</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="stat-value">{{ stats.termines }}</div>
          <div class="stat-label">Résolus</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <div class="stat-value">{{ formatNumber(stats.surface) }} m²</div>
          <div class="stat-label">Surface traitée</div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="section-header">
        <h2>Comment ça fonctionne ?</h2>
        <p>Un processus simple et efficace pour améliorer nos routes</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-number">1</div>
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <h3>Signalement</h3>
          <p>Les citoyens signalent les problèmes routiers avec géolocalisation précise</p>
        </div>
        <div class="feature-card">
          <div class="feature-number">2</div>
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h3>Analyse</h3>
          <p>Les gestionnaires évaluent la priorité et planifient les interventions</p>
        </div>
        <div class="feature-card">
          <div class="feature-number">3</div>
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>
          <h3>Intervention</h3>
          <p>Les entreprises sont assignées et les travaux débutent</p>
        </div>
        <div class="feature-card">
          <div class="feature-number">4</div>
          <div class="feature-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3>Résolution</h3>
          <p>Le problème est résolu et le statut mis à jour en temps réel</p>
        </div>
      </div>
    </section>

    <!-- Types Section -->
    <section class="types-section">
      <div class="section-header">
        <h2>Types de problèmes gérés</h2>
        <p>Notre plateforme couvre l'ensemble des dégradations routières</p>
      </div>
      <div class="types-grid">
        <div class="type-card">
          <div class="type-icon red">🕳️</div>
          <h4>Nids de poule</h4>
          <p>Trous dans la chaussée causés par l'usure</p>
        </div>
        <div class="type-card">
          <div class="type-icon orange">⚡</div>
          <h4>Fissures</h4>
          <p>Craquelures et fissures longitudinales</p>
        </div>
        <div class="type-card">
          <div class="type-icon yellow">📉</div>
          <h4>Affaissements</h4>
          <p>Effondrement partiel de la chaussée</p>
        </div>
        <div class="type-card">
          <div class="type-icon blue">🚧</div>
          <h4>Autres</h4>
          <p>Trottoirs, ponts, pistes cyclables</p>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2>Participez à l'amélioration de nos routes</h2>
        <p>Consultez la carte interactive pour voir les signalements et l'avancement des travaux</p>
        <router-link to="/carte" class="btn btn-cta">
          Accéder à la carte
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiClient from '@/services/api'

const stats = ref({
  total: 0,
  en_cours: 0,
  termines: 0,
  surface: 0
})

onMounted(async () => {
  try {
    const response = await apiClient.get('/dashboard')
    stats.value = {
      total: response.data.nb_points || 0,
      en_cours: Math.floor((response.data.nb_points || 0) * 0.4), // Estimation
      termines: Math.floor((response.data.nb_points || 0) * (response.data.avancement_pourcent || 0) / 100),
      surface: response.data.surface_totale || 0
    }
  } catch (error) {
    console.error('Erreur chargement stats:', error)
  }
})

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('fr-FR').format(num)
}
</script>

<style scoped>
.accueil-page {
  min-height: 100vh;
  background: #f8fafc;
}

/* ==================== HERO ==================== */
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  padding: 80px 5%;
  max-width: 1400px;
  margin: 0 auto;
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #ecfdf5;
  color: #059669;
  padding: 8px 16px;
  border-radius: 50px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 24px;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.2;
  margin: 0 0 24px 0;
}

.highlight {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 18px;
  color: #64748b;
  line-height: 1.7;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(30, 58, 95, 0.3);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(30, 58, 95, 0.4);
}

.btn-secondary {
  background: white;
  color: #1e3a5f;
  border: 2px solid #e2e8f0;
}

.btn-secondary:hover {
  border-color: #1e3a5f;
  background: #f8fafc;
}

.hero-visual {
  display: flex;
  justify-content: center;
}

.map-preview {
  width: 100%;
  max-width: 500px;
  height: 400px;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.map-overlay {
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M0 0h100v100H0z' fill='none' stroke='%2394a3b8' stroke-width='0.5'/%3E%3C/svg%3E");
}

.marker {
  position: absolute;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.marker::after {
  content: '';
  position: absolute;
  inset: 4px;
  background: white;
  border-radius: 50%;
}

.marker-1 {
  top: 30%;
  left: 40%;
  background: #dc2626;
}

.marker-2 {
  top: 50%;
  left: 60%;
  background: #f59e0b;
  animation-delay: 0.5s;
}

.marker-3 {
  top: 70%;
  left: 35%;
  background: #10b981;
  animation-delay: 1s;
}

.marker-4 {
  top: 45%;
  left: 25%;
  background: #dc2626;
  animation-delay: 1.5s;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
}

/* ==================== STATS ==================== */
.stats-section {
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  padding: 60px 5%;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
}

.stat-icon.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.stat-icon.yellow { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-icon.green { background: linear-gradient(135deg, #10b981, #059669); }
.stat-icon.purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: white;
  margin-bottom: 4px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

/* ==================== FEATURES ==================== */
.features-section {
  padding: 80px 5%;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-header h2 {
  font-size: 36px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.section-header p {
  color: #64748b;
  font-size: 18px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.feature-number {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.feature-icon {
  width: 64px;
  height: 64px;
  background: #f1f5f9;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #1e3a5f;
}

.feature-card h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.feature-card p {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
}

/* ==================== TYPES ==================== */
.types-section {
  background: #f1f5f9;
  padding: 80px 5%;
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.type-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;
}

.type-card:hover {
  transform: translateY(-4px);
}

.type-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.type-card h4 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.type-card p {
  color: #64748b;
  font-size: 13px;
  margin: 0;
}

/* ==================== CTA ==================== */
.cta-section {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  padding: 80px 5%;
  text-align: center;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: 32px;
  font-weight: 800;
  color: white;
  margin: 0 0 16px 0;
}

.cta-content p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  margin-bottom: 32px;
}

.btn-cta {
  background: white;
  color: #f97316;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 12px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
}

.btn-cta:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 60px 5%;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-visual {
    order: -1;
  }

  .map-preview {
    max-width: 400px;
    height: 300px;
  }

  .stats-container,
  .features-grid,
  .types-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 32px;
  }

  .stats-container,
  .features-grid,
  .types-grid {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
