// Page d'ajout d'un nouveau signalement
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRef } from 'react';
import { ajouterSignalement, type NouveauSignalement } from '../services/syncService';
import type { TypeProbleme, TypeRoute } from '../types';
import '../styles/AddSignalement.css';

const DEFAULT_CENTER: L.LatLngTuple = [-18.8792, 47.5079];

const TYPES_PROBLEME: { value: TypeProbleme; label: string }[] = [
  { value: 'nid_de_poule', label: '🕳️ Nid de poule' },
  { value: 'fissure', label: '🔨 Fissure' },
  { value: 'affaissement', label: '⬇️ Affaissement' },
  { value: 'autre', label: '❓ Autre' },
];

const TYPES_ROUTE: { value: TypeRoute; label: string }[] = [
  { value: 'route', label: '🛣️ Route' },
  { value: 'trottoir', label: '🚶 Trottoir' },
  { value: 'pont', label: '🌉 Pont' },
  { value: 'piste_cyclable', label: '🚴 Piste cyclable' },
  { value: 'autre', label: '❓ Autre' },
];

export default function AddSignalementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Coordonnées pré-remplies si navigation depuis appui prolongé sur la carte
  const stateCoords = location.state as { lat?: number; lng?: number } | null;
  const initialLat = stateCoords?.lat ?? DEFAULT_CENTER[0];
  const initialLng = stateCoords?.lng ?? DEFAULT_CENTER[1];

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [typeProbleme, setTypeProbleme] = useState<TypeProbleme>('nid_de_poule');
  const [typeRoute, setTypeRoute] = useState<TypeRoute>('route');
  const [latitude, setLatitude] = useState(initialLat);
  const [longitude, setLongitude] = useState(initialLng);
  const [adresse, setAdresse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Initialiser la mini-carte pour choisir la position
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const startPos: L.LatLngTuple = [initialLat, initialLng];
    const startZoom = stateCoords ? 17 : 15;

    const map = L.map(mapRef.current, {
      center: startPos,
      zoom: startZoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM',
      maxZoom: 19,
    }).addTo(map);

    // Marqueur déplaçable
    const marker = L.marker(startPos, { draggable: true }).addTo(map);
    marker.bindPopup(stateCoords ? '📍 Position pré-sélectionnée — déplacez si besoin' : '📍 Déplacez-moi pour choisir la position').openPopup();

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setLatitude(pos.lat);
      setLongitude(pos.lng);
    });

    // Cliquer sur la carte pour déplacer le marqueur
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLatitude(e.latlng.lat);
      setLongitude(e.latlng.lng);
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Géolocaliser pour positionner le marqueur
  const locateMe = async () => {
    setIsLocating(true);
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      const { latitude: lat, longitude: lng } = pos.coords;
      setLatitude(lat);
      setLongitude(lng);
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng], 17);
      }
    } catch {
      // Fallback navigateur
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords;
            setLatitude(lat);
            setLongitude(lng);
            if (mapInstanceRef.current && markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
              mapInstanceRef.current.setView([lat, lng], 17);
            }
          },
          () => setError('Impossible d\'obtenir votre position.'),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!titre.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }
    if (!description.trim()) {
      setError('La description est obligatoire.');
      return;
    }

    try {
      setIsSubmitting(true);
      const data: NouveauSignalement = {
        titre: titre.trim(),
        description: description.trim(),
        type_probleme: typeProbleme,
        type_route: typeRoute,
        latitude,
        longitude,
        adresse: adresse.trim(),
      };
      await ajouterSignalement(data);
      setSuccess(true);
      // Retour à la carte après 1.5s
      setTimeout(() => navigate('/map'), 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'envoi.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="success-screen">
        <div className="success-icon">✅</div>
        <h2>Signalement envoyé !</h2>
        <p>Votre signalement a été ajouté dans Firebase.</p>
        <p className="success-sub">Redirection vers la carte...</p>
      </div>
    );
  }

  return (
    <div className="add-page">
      {/* Header */}
      <header className="add-header">
        <button onClick={() => navigate('/map')} className="btn-back">
          ← Retour
        </button>
        <h1>Nouveau signalement</h1>
      </header>

      <div className="add-content">
        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <p>{error}</p>
            <button onClick={() => setError(null)} className="alert-close">×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-form">
          {/* Titre */}
          <div className="form-group">
            <label htmlFor="titre">Titre *</label>
            <input
              id="titre"
              type="text"
              placeholder="Ex: Nid de poule dangereux"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              placeholder="Décrivez le problème en détail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Type de problème */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="typeProbleme">Type de problème</label>
              <select
                id="typeProbleme"
                value={typeProbleme}
                onChange={(e) => setTypeProbleme(e.target.value as TypeProbleme)}
                disabled={isSubmitting}
              >
                {TYPES_PROBLEME.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="typeRoute">Type de route</label>
              <select
                id="typeRoute"
                value={typeRoute}
                onChange={(e) => setTypeRoute(e.target.value as TypeRoute)}
                disabled={isSubmitting}
              >
                {TYPES_ROUTE.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Adresse (optionnel) */}
          <div className="form-group">
            <label htmlFor="adresse">Adresse (optionnel)</label>
            <input
              id="adresse"
              type="text"
              placeholder="Ex: Rue de l'Indépendance, Antananarivo"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Mini carte pour choisir la position */}
          <div className="form-group">
            <label>
              Position sur la carte
              <button
                type="button"
                onClick={locateMe}
                className="btn-locate-inline"
                disabled={isLocating}
              >
                {isLocating ? '⏳' : '🎯'} Ma position
              </button>
            </label>
            <div ref={mapRef} className="mini-map" />
            <p className="form-hint">
              📍 {latitude.toFixed(5)}, {longitude.toFixed(5)} — Cliquez ou déplacez le marqueur
            </p>
          </div>

          {/* Bouton envoyer */}
          <button
            type="submit"
            className="btn btn-primary btn-submit"
            disabled={isSubmitting || !titre || !description}
          >
            {isSubmitting ? (
              <span className="btn-loading">
                <span className="spinner-small" />
                Envoi en cours...
              </span>
            ) : (
              '🔥 Envoyer sur Firebase'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
