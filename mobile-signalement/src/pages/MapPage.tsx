// Page de la carte Leaflet avec géolocalisation et marqueurs
import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../contexts/AuthContext';
import { getProblemes } from '../services/problemesService';
import type { Probleme, StatutProbleme, TypeProbleme } from '../types';
import '../styles/Map.css';

// Fix pour les icônes Leaflet manquantes avec les bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Corriger le bug des icônes Leaflet avec Vite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Centre par défaut : Antananarivo
const DEFAULT_CENTER: L.LatLngTuple = [-18.8792, 47.5079];
const DEFAULT_ZOOM = 13;

// Couleurs des marqueurs par statut
const STATUT_COLORS: Record<StatutProbleme, string> = {
  nouveau: '#ef4444',     // Rouge
  en_cours: '#f59e0b',    // Jaune/Orange
  termine: '#22c55e',     // Vert
};

const STATUT_LABELS: Record<StatutProbleme, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  termine: 'Terminé',
};

const TYPE_LABELS: Record<TypeProbleme, string> = {
  nid_de_poule: 'Nid de poule',
  fissure: 'Fissure',
  affaissement: 'Affaissement',
  autre: 'Autre',
};

/**
 * Crée une icône de marqueur SVG colorée
 */
function createColoredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" 
              fill="${color}" stroke="#fff" stroke-width="2"/>
        <circle cx="14" cy="14" r="6" fill="#fff"/>
      </svg>
    `,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [problemes, setProblemes] = useState<Probleme[]>([]);
  const [loadingProblemes, setLoadingProblemes] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatut, setFilterStatut] = useState<StatutProbleme | 'tous'>('tous');

  const { user, logout } = useAuth();

  // Initialiser la carte
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // On le repositionne
    });

    // Tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control en bas à droite
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer group pour les marqueurs
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    // Cleanup
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Charger les problèmes
  const loadProblemes = useCallback(async () => {
    try {
      setLoadingProblemes(true);
      const data = await getProblemes();
      setProblemes(data);
    } catch (err) {
      console.warn('Impossible de charger les problèmes:', err);
      // En mode mobile/offline, on peut ne pas avoir accès à l'API
    } finally {
      setLoadingProblemes(false);
    }
  }, []);

  useEffect(() => {
    loadProblemes();
  }, [loadProblemes]);

  // Mettre à jour les marqueurs quand les problèmes ou filtres changent
  useEffect(() => {
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered =
      filterStatut === 'tous'
        ? problemes
        : problemes.filter((p) => p.statut === filterStatut);

    filtered.forEach((probleme) => {
      if (!probleme.latitude || !probleme.longitude) return;

      const icon = createColoredIcon(STATUT_COLORS[probleme.statut]);
      const marker = L.marker([probleme.latitude, probleme.longitude], { icon });

      marker.bindPopup(`
        <div class="popup-content">
          <h3>${probleme.titre || 'Sans titre'}</h3>
          <p class="popup-type">${TYPE_LABELS[probleme.type_probleme] || probleme.type_probleme}</p>
          <p class="popup-description">${probleme.description || ''}</p>
          <div class="popup-status popup-status-${probleme.statut}">
            ${STATUT_LABELS[probleme.statut]}
          </div>
          <p class="popup-date">📅 ${new Date(probleme.date_signalement).toLocaleDateString('fr-FR')}</p>
          ${probleme.adresse ? `<p class="popup-address">📍 ${probleme.adresse}</p>` : ''}
        </div>
      `);

      marker.addTo(markersLayerRef.current!);
    });
  }, [problemes, filterStatut]);

  // Géolocalisation
  const locateUser = async () => {
    if (!mapInstanceRef.current) return;

    setIsLocating(true);
    setGeoError(null);

    try {
      // Essayer d'abord avec Capacitor (mobile natif)
      const { Geolocation } = await import('@capacitor/geolocation');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
      });

      const { latitude, longitude } = position.coords;
      updateUserPosition(latitude, longitude);
    } catch {
      // Fallback: API Web standard
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            updateUserPosition(latitude, longitude);
          },
          (err) => {
            setGeoError(getGeoErrorMessage(err.code));
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setGeoError('La géolocalisation n\'est pas supportée.');
        setIsLocating(false);
      }
    }
  };

  const updateUserPosition = (lat: number, lng: number) => {
    if (!mapInstanceRef.current) return;

    // Supprimer l'ancien marqueur
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Icône de position utilisateur
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="user-dot">
          <div class="user-dot-inner"></div>
          <div class="user-dot-pulse"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([lat, lng], { icon: userIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup('📍 Votre position');

    userMarkerRef.current = marker;
    mapInstanceRef.current.setView([lat, lng], 16);
    setIsLocating(false);
  };

  return (
    <div className="map-page">
      {/* Header */}
      <header className="map-header">
        <div className="header-left">
          <h1>📍 Signalement</h1>
        </div>
        <div className="header-right">
          <span className="user-name">{user?.name}</span>
          <button onClick={logout} className="btn-logout" title="Déconnexion">
            🚪
          </button>
        </div>
      </header>

      {/* Carte */}
      <div ref={mapRef} className="map-container" />

      {/* Contrôles flottants */}
      <div className="map-controls">
        {/* Bouton de géolocalisation */}
        <button
          onClick={locateUser}
          className={`map-btn map-btn-locate ${isLocating ? 'locating' : ''}`}
          disabled={isLocating}
          title="Ma position"
        >
          {isLocating ? '⏳' : '🎯'}
        </button>

        {/* Bouton de filtre */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`map-btn ${showFilters ? 'active' : ''}`}
          title="Filtrer"
        >
          🔍
        </button>

        {/* Bouton de rafraîchissement */}
        <button
          onClick={loadProblemes}
          className={`map-btn ${loadingProblemes ? 'loading' : ''}`}
          disabled={loadingProblemes}
          title="Rafraîchir"
        >
          🔄
        </button>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="filter-panel">
          <h3>Filtrer par statut</h3>
          <div className="filter-options">
            <button
              onClick={() => setFilterStatut('tous')}
              className={`filter-btn ${filterStatut === 'tous' ? 'active' : ''}`}
            >
              Tous ({problemes.length})
            </button>
            {(Object.keys(STATUT_COLORS) as StatutProbleme[]).map((statut) => (
              <button
                key={statut}
                onClick={() => setFilterStatut(statut)}
                className={`filter-btn ${filterStatut === statut ? 'active' : ''}`}
              >
                <span
                  className="filter-dot"
                  style={{ backgroundColor: STATUT_COLORS[statut] }}
                />
                {STATUT_LABELS[statut]} (
                {problemes.filter((p) => p.statut === statut).length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="map-legend">
        {(Object.keys(STATUT_COLORS) as StatutProbleme[]).map((statut) => (
          <div key={statut} className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: STATUT_COLORS[statut] }}
            />
            <span>{STATUT_LABELS[statut]}</span>
          </div>
        ))}
      </div>

      {/* Erreur géolocalisation */}
      {geoError && (
        <div className="geo-error">
          <p>{geoError}</p>
          <button onClick={() => setGeoError(null)}>×</button>
        </div>
      )}
    </div>
  );
}

function getGeoErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return 'Permission de géolocalisation refusée.';
    case 2:
      return 'Position indisponible.';
    case 3:
      return 'Délai d\'attente dépassé.';
    default:
      return 'Erreur de géolocalisation.';
  }
}
