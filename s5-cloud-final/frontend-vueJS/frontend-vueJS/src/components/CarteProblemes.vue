<template>
  <div class="carte-container">
    <!-- Tableau de récapitulation -->
    <div class="dashboard-summary">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Tableau de Récapitulation</h5>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-icon primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3>{{ stats.nb_points }}</h3>
              <p>Points signalés</p>
            </div>
            
            <div class="stat-box">
              <div class="stat-icon info">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <h3>{{ formatNumber(stats.surface_totale) }} m²</h3>
              <p>Surface totale</p>
            </div>
            
            <div class="stat-box">
              <div class="stat-icon success">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3>{{ formatCurrency(stats.budget_total) }}</h3>
              <p>Budget total</p>
            </div>
            
            <div class="stat-box">
              <div class="stat-icon warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3>{{ stats.avancement_pourcent }}%</h3>
              <p>Avancement</p>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: stats.avancement_pourcent + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Carte -->
    <div ref="mapContainer" class="map-container"></div>

    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Chargement des données...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useProblemesStore } from '@/stores/problemes';
import type { ProblemeRoutier } from '@/types/probleme';

const problemesStore = useProblemesStore();
const { problemes, stats, loading } = storeToRefs(problemesStore);

const mapContainer = ref<HTMLDivElement | null>(null);
let map: maplibregl.Map | null = null;
const markers: maplibregl.Marker[] = [];

onMounted(async () => {
  initMap();
  await problemesStore.loadAllData();
  addMarkers();
});

function initMap() {
  if (!mapContainer.value) return;

  const styleUrl = 'http://localhost:8081/styles/basic-preview/style.json';
  const center: [number, number] = [47.5079, -18.8792];

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: styleUrl,
    center: center,
    zoom: 13,
  });

  map.addControl(new maplibregl.NavigationControl());
  map.addControl(new maplibregl.FullscreenControl());

  map.on('error', (e) => {
    console.error('Map error:', e);
  });
}

function addMarkers() {
  if (!map) return;

  // Supprimer les anciens markers
  markers.forEach((marker) => marker.remove());
  markers.length = 0;

  problemes.value.forEach((probleme: ProblemeRoutier) => {
    if (!probleme.latitude || !probleme.longitude) return;

    const color = getStatutColor(probleme.statut);

    // Créer l'élément du marker
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.backgroundColor = color;
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.cursor = 'pointer';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

    // Créer le popup
    const popup = new maplibregl.Popup({
      offset: 25,
      closeButton: true,
      closeOnClick: false,
    }).setHTML(`
      <div class="popup-content">
        <h6><strong>${probleme.titre || 'Sans titre'}</strong></h6>
        <p><strong>Statut:</strong> <span class="badge ${getStatutBadge(probleme.statut)}">${formatStatut(probleme.statut)}</span></p>
        <p><strong>Type:</strong> ${formatType(probleme.type_probleme)}</p>
        <p><strong>Surface:</strong> ${formatNumber(probleme.surface_m2)} m²</p>
        <p><strong>Budget:</strong> ${formatCurrency(probleme.budget)}</p>
        <p><strong>Entreprise:</strong> ${probleme.entreprise || 'Non assignée'}</p>
        <p><strong>Date:</strong> ${formatDate(probleme.date_signalement)}</p>
      </div>
    `);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([probleme.longitude, probleme.latitude])
      .setPopup(popup)
      .addTo(map);

    markers.push(marker);
  });
}

function getStatutColor(statut: string): string {
  const colors: Record<string, string> = {
    nouveau: '#dc3545',
    en_cours: '#ffc107',
    termine: '#28a745',
  };
  return colors[statut] || '#6c757d';
}

function getStatutBadge(statut: string): string {
  const badges: Record<string, string> = {
    nouveau: 'badge-danger',
    en_cours: 'badge-warning',
    termine: 'badge-success',
  };
  return badges[statut] || 'badge-secondary';
}

function formatStatut(statut: string): string {
  const labels: Record<string, string> = {
    nouveau: 'Nouveau',
    en_cours: 'En cours',
    termine: 'Terminé',
  };
  return labels[statut] || statut;
}

function formatType(type: string): string {
  const labels: Record<string, string> = {
    nid_de_poule: 'Nid de poule',
    fissure: 'Fissure',
    affaissement: 'Affaissement',
    autre: 'Autre',
  };
  return labels[type] || type;
}

function formatDate(date: string): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('fr-FR');
}

function formatNumber(number: number): string {
  if (!number) return '0';
  return new Intl.NumberFormat('fr-FR').format(number);
}

function formatCurrency(amount: number): string {
  if (!amount) return '0 Ar';
  return new Intl.NumberFormat('fr-FR').format(amount) + ' Ar';
}
</script>

<style scoped>
.carte-container {
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: #f8f9fa;
}

.dashboard-summary {
  padding: 20px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 10;
  position: relative;
}

.card {
  border: none;
  border-radius: 8px;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 20px;
  color: #2c3e50;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-box {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.stat-icon.primary { background: #e3f2fd; color: #1976d2; }
.stat-icon.info { background: #e0f7fa; color: #0097a7; }
.stat-icon.success { background: #e8f5e9; color: #388e3c; }
.stat-icon.warning { background: #fff3e0; color: #f57c00; }

.stat-box h3 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 10px 0 5px;
  color: #2c3e50;
}

.stat-box p {
  margin: 0;
  font-size: 0.9rem;
  color: #6c757d;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  margin-top: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.map-container {
  width: 100%;
  height: calc(100vh - 220px);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 15px;
  color: #2c3e50;
  font-size: 1rem;
}

:deep(.maplibregl-popup-content) {
  padding: 15px;
  min-width: 250px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

:deep(.popup-content) {
  font-size: 0.9rem;
}

:deep(.popup-content h6) {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 8px;
  margin-bottom: 10px;
}

:deep(.popup-content p) {
  margin: 8px 0;
  line-height: 1.6;
}

:deep(.badge) {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

:deep(.badge-danger) { background: #dc3545; color: white; }
:deep(.badge-warning) { background: #ffc107; color: #333; }
:deep(.badge-success) { background: #28a745; color: white; }
</style>