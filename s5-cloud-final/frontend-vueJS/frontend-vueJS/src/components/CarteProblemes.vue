<template>
  <div class="carte-container">
    <!-- Bouton de synchronisation Firebase -->
    <div class="sync-header">
      <SyncButton 
        :show-stats="true"
        @sync-complete="handleSyncComplete"
        @sync-error="handleSyncError"
      />
    </div>

    <!-- Notifications d'erreurs -->
    <transition-group name="notification" tag="div" class="notifications-container">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification"
        :class="notification.type"
      >
        <div class="notification-icon">
          <svg v-if="notification.type === 'error'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <svg v-else-if="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <svg v-else-if="notification.type === 'warning'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div class="notification-content">
          <h4>{{ notification.title }}</h4>
          <p>{{ notification.message }}</p>
        </div>
        <button @click="removeNotification(notification.id)" class="notification-close">
          ×
        </button>
      </div>
    </transition-group>

    <!-- Tableau de récapitulation -->
    <div class="dashboard-summary">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Tableau de Récapitulation</h5>
          
          <!-- Affichage erreur de chargement des stats -->
          <div v-if="statsError" class="error-banner">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Erreur de chargement des statistiques: {{ statsError }}</span>
            <button @click="reloadStats" class="retry-btn">Réessayer</button>
          </div>

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
              <div class="progress-bar-stats">
                <div class="progress-fill" :style="{ width: stats.avancement_pourcent + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Carte -->
    <div class="map-wrapper">
      <!-- Erreur de chargement de la carte -->
      <div v-if="mapError" class="map-error-overlay">
        <div class="error-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <h3>Erreur de chargement de la carte</h3>
          <p>{{ mapError }}</p>
          <button @click="reloadMap" class="reload-btn">Recharger la carte</button>
        </div>
      </div>
      
      <div ref="mapContainer" class="map-container" :class="{ 'map-hidden': mapError }"></div>
    </div>

    <!-- Loading overlay -->
    <div v-if="loading || syncLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ loading ? 'Chargement des données...' : 'Synchronisation en cours...' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useProblemesStore } from '@/stores/problemes';
import { useSynchronisationStore } from '@/stores/synchronisation';
import SyncButton from '@/components/SyncButton.vue';
import type { ProblemeRoutier } from '@/types/probleme';
import api from '@/services/api';

const problemesStore = useProblemesStore();
const { problemes, stats, loading } = storeToRefs(problemesStore);

const syncStore = useSynchronisationStore();
const { isLoading: syncLoading } = storeToRefs(syncStore);

const mapContainer = ref<HTMLDivElement | null>(null);
let map: maplibregl.Map | null = null;
const markers: maplibregl.Marker[] = [];

// Gestion des erreurs
const mapError = ref<string | null>(null);
const statsError = ref<string | null>(null);

// Système de notifications
interface Notification {
  id: number;
  type: 'error' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

const notifications = ref<Notification[]>([]);
let notificationId = 0;

const addNotification = (type: Notification['type'], title: string, message: string, duration = 5000) => {
  const id = notificationId++;
  notifications.value.push({ id, type, title, message });
  
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }
};

const removeNotification = (id: number) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
};

onMounted(async () => {
  try {
    await initMapAsync();
    await loadData();
  } catch (error: any) {
    console.error('Erreur au montage du composant:', error);
    addNotification('error', 'Erreur d\'initialisation', error.message);
  }
});

async function initMapAsync() {
  return new Promise<void>((resolve, reject) => {
    if (!mapContainer.value) {
      mapError.value = 'Conteneur de carte non disponible';
      reject(new Error('Conteneur de carte non disponible'));
      return;
    }

    try {
      const styleUrl = 'http://localhost:8081/styles/basic-preview/style.json';
      const center: [number, number] = [47.5079, -18.8792];

      map = new maplibregl.Map({
        container: mapContainer.value,
        style: styleUrl,
        center: center,
        zoom: 13,
      });

      map.on('load', () => {
        console.log('✅ Carte chargée avec succès');
        mapError.value = null;
        resolve();
      });

      map.on('error', (e) => {
        console.error('❌ Erreur carte MapLibre:', e);
        const errorMsg = e.error?.message || 'Erreur de chargement de la carte';
        mapError.value = errorMsg;
        addNotification('error', 'Erreur carte', errorMsg, 0);
        reject(new Error(errorMsg));
      });

    } catch (error: any) {
      console.error('❌ Erreur initialisation carte:', error);
      mapError.value = error.message || 'Impossible d\'initialiser la carte';
      addNotification('error', 'Erreur carte', mapError.value, 0);
      reject(error);
    }
  });
}

async function loadData() {
  try {
    statsError.value = null;
    await problemesStore.loadAllData();
    
    // S'assurer que la carte est prête avant d'ajouter les markers
    if (map && map.loaded()) {
      addMarkers();
    } else if (map) {
      // Attendre que la carte se charge
      map.on('load', () => {
        addMarkers();
      });
    }
    
    if (problemes.value.length === 0) {
      addNotification('info', 'Aucune donnée', 'Aucun signalement trouvé. Synchronisez avec Firebase.', 8000);
    }
  } catch (error: any) {
    console.error('Erreur de chargement des données:', error);
    statsError.value = error.message || 'Erreur inconnue';
    addNotification('error', 'Erreur de chargement', 'Impossible de charger les données depuis PostgreSQL', 0);
  }
}



// Cache pour les photos chargées
const photosCache = new Map<number, any[]>();

function addMarkers() {
  if (!map) {
    console.warn('⚠️ Carte non initialisée, impossible d\'ajouter les markers');
    return;
  }

  try {
    // Supprimer les anciens markers
    markers.forEach((marker) => marker.remove());
    markers.length = 0;

    let markersAdded = 0;
    let markersSkipped = 0;

    problemes.value.forEach((probleme: ProblemeRoutier) => {
      if (!probleme.latitude || !probleme.longitude) {
        markersSkipped++;
        return;
      }

      try {
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

        // Créer le popup avec tous les champs et photos
        let photosHTML = '<div class="popup-photos-section" style="margin-top: 12px;"><strong>Photos:</strong><div class="photos-gallery" id="photos-' + probleme.id_probleme + '" style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;"><span style="font-size: 12px; color: #999;">Chargement...</span></div></div>';
        
        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
        }).setHTML(`
          <div class="popup-content">
            <h6><strong>${probleme.titre || 'Sans titre'}</strong></h6>
            <p><strong>Statut:</strong> <span class="badge ${getStatutBadge(probleme.statut)}">${formatStatut(probleme.statut)}</span></p>
            <p><strong>Type problème:</strong> ${formatType(probleme.type_probleme)}</p>
            <p><strong>Type route:</strong> ${formatTypeRoute(probleme.type_route)}</p>
            <p><strong>Surface:</strong> ${formatNumber(probleme.surface_m2)} m²</p>
            <p><strong>Budget:</strong> ${formatCurrency(probleme.budget)}</p>
            <p><strong>Entreprise:</strong> ${probleme.entreprise || 'Non assignée'}</p>
            <p><strong>Date signalement:</strong> ${formatDate(probleme.date_signalement)}</p>
            ${probleme.date_debut ? `<p><strong>Date début:</strong> ${formatDate(probleme.date_debut)}</p>` : ''}
            ${probleme.date_fin ? `<p><strong>Date fin:</strong> ${formatDate(probleme.date_fin)}</p>` : ''}
            ${photosHTML}
          </div>
        `);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([probleme.longitude, probleme.latitude])
          .setPopup(popup)
          .addTo(map!);

        // Charger les photos quand le popup s'ouvre
        popup.on('open', () => {
          displayPhotos(probleme.id_probleme);
        });

        markers.push(marker);
        markersAdded++;
      } catch (error: any) {
        console.error(`❌ Erreur ajout marker pour ${probleme.titre}:`, error);
        markersSkipped++;
      }
    });

    console.log(`✅ ${markersAdded} markers ajoutés, ${markersSkipped} ignorés`);
    
    if (markersSkipped > 0) {
      addNotification('warning', 'Markers incomplets', `${markersSkipped} signalement(s) sans coordonnées GPS valides`, 5000);
    }

    // Pré-charger toutes les photos pour une meilleure performance
    preloadAllPhotos();

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'ajout des markers:', error);
    addNotification('error', 'Erreur markers', error.message);
  }
}

// Pré-charger toutes les photos
async function preloadAllPhotos() {
  for (const probleme of problemes.value) {
    if (!photosCache.has(probleme.id_probleme)) {
      loadPhotosForProbleme(probleme.id_probleme);
    }
  }
}

// Afficher les photos du cache ou charger si nécessaire
async function displayPhotos(id_probleme: number) {
  const container = document.getElementById(`photos-${id_probleme}`);
  if (!container) return;

  // Si en cache, afficher immédiatement
  if (photosCache.has(id_probleme)) {
    renderPhotos(id_probleme, photosCache.get(id_probleme)!);
    return;
  }

  // Sinon charger et afficher
  try {
    const response = await api.get(`/problemes/${id_probleme}/photos`);
    const photos = response.data;
    photosCache.set(id_probleme, photos);
    renderPhotos(id_probleme, photos);
  } catch (error: any) {
    console.error(`Erreur chargement photos:`, error);
    container.innerHTML = '<span style="font-size: 12px; color: #999;">Erreur chargement</span>';
  }
}

// Charger les photos d'un problème en arrière-plan
async function loadPhotosForProbleme(id_probleme: number) {
  try {
    const response = await api.get(`/problemes/${id_probleme}/photos`);
    const photos = response.data;
    photosCache.set(id_probleme, photos);
  } catch (error: any) {
    console.error(`Erreur pré-chargement photos pour ${id_probleme}:`, error);
  }
}

// Rendu des photos dans le conteneur
function renderPhotos(id_probleme: number, photos: any[]) {
  const container = document.getElementById(`photos-${id_probleme}`);
  if (!container) return;

  if (photos.length === 0) {
    container.innerHTML = '<span style="font-size: 12px; color: #999;">Aucune photo</span>';
    return;
  }

  let photosHTML = '';
  photos.forEach((photo: any) => {
    photosHTML += `
      <div class="photo-thumbnail" style="position: relative;">
        <img src="${photo.url}" alt="${photo.nom_fichier}" 
             style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 1px solid #ddd;"
             title="${photo.description || photo.nom_fichier}"
             onclick="window.open('${photo.url}', '_blank')">
        <div class="photo-hover-info" style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 4px; font-size: 11px; border-radius: 0 0 4px 4px; opacity: 0; transition: opacity 0.3s; pointer-events: none;">
          ${photo.description || 'Photo'}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = photosHTML;
  
  // Ajouter hover effect
  container.querySelectorAll('.photo-thumbnail').forEach((el: any) => {
    el.addEventListener('mouseenter', () => {
      const info = el.querySelector('.photo-hover-info');
      if (info) info.style.opacity = '1';
    });
    el.addEventListener('mouseleave', () => {
      const info = el.querySelector('.photo-hover-info');
      if (info) info.style.opacity = '0';
    });
  });
}

// Gérer la fin de synchronisation
const handleSyncComplete = async (resultat: any) => {
  console.log('✅ Synchronisation terminée avec succès:', resultat);
  
  try {
    // Recharger les données depuis PostgreSQL
    await problemesStore.loadAllData();
    
    // Rafraîchir les markers sur la carte
    addMarkers();
    
    console.log('✅ Carte mise à jour avec les nouvelles données');
    addNotification('success', 'Synchronisation réussie', `${resultat.stats.envoyes} signalement(s) synchronisé(s)`, 5000);
    
  } catch (error: any) {
    console.error('❌ Erreur lors du rechargement des données:', error);
    addNotification('error', 'Erreur après synchronisation', 'Impossible de recharger les données', 0);
  }
}

const handleSyncError = (error: string) => {
  console.error('❌ Erreur de synchronisation:', error);
  addNotification('error', 'Échec de synchronisation', error, 0);
}

// Fonctions de rechargement
const reloadMap = async () => {
  mapError.value = null;
  await initMapAsync();
  if (problemes.value.length > 0) {
    addMarkers();
  }
};

const reloadStats = async () => {
  await loadData();
};

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

function formatTypeRoute(type: string): string {
  const labels: Record<string, string> = {
    pont: 'Pont',
    trottoir: 'Trottoir',
    route: 'Route',
    piste_cyclable: 'Piste cyclable',
    autre: 'Autre',
  };
  return labels[type] || type;
}

function formatDate(date: string): string {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('fr-FR');
  } catch {
    return 'Date invalide';
  }
}

function formatNumber(number: number): string {
  if (!number) return '0';
  try {
    return new Intl.NumberFormat('fr-FR').format(number);
  } catch {
    return String(number);
  }
}

function formatCurrency(amount: number): string {
  if (!amount) return '0 Ar';
  try {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' Ar';
  } catch {
    return String(amount) + ' Ar';
  }
}
</script>

<style scoped>
/* =========================
   CONTAINER GLOBAL
========================= */
.carte-container {
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: #f4f6f9;
  overflow-y: auto;
}

/* =========================
   NOTIFICATIONS
========================= */
.notifications-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: white;
  border-left: 4px solid;
  animation: slideIn 0.3s ease-out;
}

.notification.error {
  border-left-color: #dc3545;
  background: #fff5f5;
}

.notification.success {
  border-left-color: #28a745;
  background: #f0fff4;
}

.notification.warning {
  border-left-color: #ffc107;
  background: #fffbf0;
}

.notification.info {
  border-left-color: #17a2b8;
  background: #f0f9ff;
}

.notification-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification.error .notification-icon { color: #dc3545; }
.notification.success .notification-icon { color: #28a745; }
.notification.warning .notification-icon { color: #ffc107; }
.notification.info .notification-icon { color: #17a2b8; }

.notification-content {
  flex: 1;
}

.notification-content h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 700;
  color: #2c3e50;
}

.notification-content p {
  margin: 0;
  font-size: 13px;
  color: #6c757d;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #6c757d;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.notification-close:hover {
  opacity: 1;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(400px);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(400px);
  opacity: 0;
}

/* =========================
   HEADER SYNCHRONISATION
========================= */
.sync-header {
  padding: 16px 20px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 11;
  position: sticky;
  top: 0;
  border-bottom: 1px solid #e9ecef;
}

/* =========================
   ERROR BANNER
========================= */
.error-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: #fff5f5;
  border: 1px solid #ffcdd2;
  border-left: 4px solid #dc3545;
  border-radius: 8px;
  color: #721c24;
}

.error-banner svg {
  color: #dc3545;
  flex-shrink: 0;
}

.error-banner span {
  flex: 1;
  font-size: 14px;
}

.retry-btn {
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #c82333;
}

/* =========================
   DASHBOARD
========================= */
.dashboard-summary {
  padding: 20px;
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 10;
  position: relative;
}

.card {
  border: none;
  border-radius: 12px;
}

.card-title {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #2c3e50;
}

/* =========================
   GRID STATS
========================= */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

/* =========================
   STAT BOX (HOVER)
========================= */
.stat-box {
  position: relative;
  text-align: center;
  padding: 18px;
  background: #f8f9fa;
  border-radius: 14px;
  cursor: pointer;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    background-color 0.25s ease;
}

.stat-box::before {
  content: "";
  position: absolute;
  top: 0;
  left: 15%;
  width: 70%;
  height: 4px;
  background: linear-gradient(90deg, #3498db, #6dd5fa);
  border-radius: 0 0 6px 6px;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.stat-box:hover {
  transform: translateY(-6px) scale(1.03);
  background-color: #ffffff;
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.15),
    0 6px 12px rgba(0, 0, 0, 0.1);
}

.stat-box:hover::before {
  opacity: 1;
}

.stat-box:active {
  transform: translateY(-2px) scale(0.98);
}

/* =========================
   ICÔNES
========================= */
.stat-icon {
  width: 50px;
  height: 50px;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.stat-box:hover .stat-icon {
  transform: scale(1.15) rotate(3deg);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.15);
}

.stat-icon.primary { background: #e3f2fd; color: #1976d2; }
.stat-icon.info    { background: #e0f7fa; color: #0097a7; }
.stat-icon.success { background: #e8f5e9; color: #388e3c; }
.stat-icon.warning { background: #fff3e0; color: #f57c00; }

/* =========================
   TEXTE STATS
========================= */
.stat-box h3 {
  font-size: 1.9rem;
  font-weight: 800;
  margin: 10px 0 5px;
  color: #2c3e50;
}

.stat-box p {
  margin: 0;
  font-size: 0.9rem;
  color: #6c757d;
}

/* =========================
   PROGRESS BAR (Stats)
========================= */
.progress-bar-stats {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 6px;
  margin-top: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease, filter 0.3s ease;
}

.stat-box:hover .progress-fill {
  filter: brightness(1.2);
}

/* =========================
   MAP WRAPPER & ERROR
========================= */
.map-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 320px);
  min-height: 400px;
}

.map-error-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.error-content {
  text-align: center;
  padding: 40px;
  max-width: 500px;
}

.error-content svg {
  color: #dc3545;
  margin-bottom: 20px;
}

.error-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 12px;
}

.error-content p {
  color: #6c757d;
  margin-bottom: 24px;
  line-height: 1.6;
}

.reload-btn {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.reload-btn:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* =========================
   MAP
========================= */
.map-container {
  width: 100%;
  height: 100%;
  transition: opacity 0.3s;
}

.map-container.map-hidden {
  opacity: 0.3;
  pointer-events: none;
}

/* =========================
   LOADING
========================= */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 15px;
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 500;
}

/* =========================
   MARKERS MAPLIBRE
========================= */
:deep(.custom-marker) {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border 0.2s ease;
}

:deep(.custom-marker:hover) {
  transform: scale(1.4);
  z-index: 5;
  box-shadow:
    0 0 0 6px rgba(52, 152, 219, 0.25),
    0 8px 22px rgba(0, 0, 0, 0.35);
  border: 2px solid #ffffff;
}

/* =========================
   POPUP MAPLIBRE (LISIBILITÉ)
========================= */
:deep(.maplibregl-popup-content) {
  background-color: #ffffff !important;
  color: #2c3e50 !important;
  padding: 16px;
  min-width: 280px;
  max-width: 350px;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

/* Texte popup */
:deep(.popup-content),
:deep(.popup-content p),
:deep(.popup-content span),
:deep(.popup-content strong) {
  color: #2c3e50 !important;
  font-weight: 500;
}

:deep(.popup-content h6) {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2d3d !important;
  border-bottom: 2px solid #3498db;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

:deep(.popup-content p) {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

:deep(.popup-content p strong) {
  color: #495057 !important;
  min-width: 120px;
}

/* =========================
   BADGES
========================= */
:deep(.badge) {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  display: inline-block;
}

:deep(.badge-danger)  { background: #dc3545; color: #fff; }
:deep(.badge-warning) { background: #ffc107; color: #333; }
:deep(.badge-success) { background: #28a745; color: #fff; }
:deep(.badge-secondary) { background: #6c757d; color: #fff; }

/* =========================
   BOUTON FERMETURE POPUP
========================= */
:deep(.maplibregl-popup-close-button) {
  color: #2c3e50 !important;
  font-size: 20px;
  opacity: 0.7;
  padding: 4px 8px;
  transition: all 0.2s ease;
}

:deep(.maplibregl-popup-close-button:hover) {
  color: #e74c3c !important;
  opacity: 1;
  transform: scale(1.1);
}

/* Flèche popup */
:deep(.maplibregl-popup-tip) {
  border-top-color: #ffffff !important;
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 768px) {
  .notifications-container {
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .sync-header {
    padding: 12px 16px;
  }
  
  .dashboard-summary {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .stat-box {
    padding: 14px;
  }
  
  .stat-box h3 {
    font-size: 1.5rem;
  }
  
  .card-title {
    font-size: 1.1rem;
  }
  
  .map-wrapper {
    height: calc(100vh - 380px);
  }
  
  :deep(.maplibregl-popup-content) {
    min-width: 240px;
    max-width: 280px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  :deep(.popup-content p) {
    flex-direction: column;
    gap: 4px;
  }
  
  :deep(.popup-content p strong) {
    min-width: auto;
  }
}
</style>