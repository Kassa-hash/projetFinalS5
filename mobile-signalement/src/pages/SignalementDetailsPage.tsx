// Page de détails d'un signalement avec galerie photo
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recupererSignalements } from '../services/syncService';
import type { Probleme, TypeProbleme, StatutProbleme } from '../types';
import '../styles/SignalementDetails.css';

const STATUT_LABELS: Record<StatutProbleme, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  termine: 'Terminé',
};

const TYPE_LABELS: Record<TypeProbleme, string> = {
  nid_de_poule: '🕳️ Nid de poule',
  fissure: '🔨 Fissure',
  affaissement: '⬇️ Affaissement',
  autre: '❓ Autre',
};

export default function SignalementDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [signalement, setSignalement] = useState<Probleme | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    const loadSignalement = async () => {
      try {
        const { data } = await recupererSignalements();
        // Chercher d'abord par firebase_id (pour Firebase)
        // Sinon par id numérique (pour PostgreSQL)
        const found = data.find(
          p => p.firebase_id === id || String(p.id) === id
        );
        if (found) {
          setSignalement(found);
          console.log('✅ Signalement trouvé:', found);
        } else {
          console.error('❌ Signalement non trouvé. ID recherché:', id);
          console.log('Signalements disponibles:', data.map(p => ({ id: p.id, firebase_id: p.firebase_id, titre: p.titre })));
        }
      } catch (err) {
        console.error('Erreur chargement signalement:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSignalement();
  }, [id]);

  if (loading) {
    return (
      <div className="details-page">
        <div className="details-loading">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!signalement) {
    return (
      <div className="details-page">
        <div className="details-error">
          <p>❌ Signalement non trouvé</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  // Les photos peuvent être dans `photos` (structure PostgreSQL) ou `photoUrls` (base64 Firestore)
  const photos = signalement.photos || [];
  const photoUrls = signalement.photoUrls || [];
  
  // Convertir photoUrls en format Photo si nécessaire
  const allPhotos = photos.length > 0 
    ? photos 
    : photoUrls.map((url, idx) => ({
        id: idx,
        url,
        chemin: url,
      }));
  
  const hasPhotos = allPhotos.length > 0;
  const currentPhoto = hasPhotos ? allPhotos[selectedPhotoIndex] : null;

  return (
    <div className="details-page">
      {/* Header */}
      <div className="details-header">
        <button onClick={() => navigate(-1)} className="btn-back">
          ← Retour
        </button>
        <h1>{signalement.titre || 'Sans titre'}</h1>
        <div className={`status-badge status-${signalement.statut}`}>
          {STATUT_LABELS[signalement.statut]}
        </div>
      </div>

      {/* Galerie de photos - Full width */}
      {hasPhotos ? (
        <div className="photos-section">
          <div className="photo-viewer">
            {currentPhoto && (
              <>
                <img
                  src={currentPhoto.url || currentPhoto.chemin || ''}
                  alt={`Photo ${selectedPhotoIndex + 1}`}
                  className="main-photo"
                />
                <div className="photo-counter">
                  {selectedPhotoIndex + 1} / {allPhotos.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {allPhotos.length > 1 && (
            <div className="photo-thumbnails">
              {allPhotos.map((photo, index) => (
                <button
                  key={index}
                  className={`thumbnail ${index === selectedPhotoIndex ? 'active' : ''}`}
                  onClick={() => setSelectedPhotoIndex(index)}
                >
                  <img
                    src={photo.url || photo.chemin || ''}
                    alt={`Thumbnail ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="no-photos">
          <p>📸 Aucune photo disponible</p>
        </div>
      )}

      {/* Détails du signalement */}
      <div className="details-content">
        <section className="info-section">
          <h2>📋 Informations</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Type de problème</label>
              <p>{TYPE_LABELS[signalement.type_probleme] || signalement.type_probleme}</p>
            </div>
            <div className="info-item">
              <label>Statut</label>
              <p className={`status-label status-${signalement.statut}`}>
                {STATUT_LABELS[signalement.statut]}
              </p>
            </div>
            <div className="info-item">
              <label>Date de signalement</label>
              <p>{new Date(signalement.date_signalement).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className="info-item">
              <label>Localisation</label>
              <p>
                {signalement.latitude?.toFixed(4)}, {signalement.longitude?.toFixed(4)}
              </p>
            </div>
          </div>
        </section>

        {signalement.adresse && (
          <section className="address-section">
            <h2>📍 Adresse</h2>
            <p>{signalement.adresse}</p>
          </section>
        )}

        {signalement.description && (
          <section className="description-section">
            <h2>📝 Description</h2>
            <p>{signalement.description}</p>
          </section>
        )}

        {signalement.type_route && (
          <section className="road-type-section">
            <h2>🛣️ Type de route</h2>
            <p>
              {signalement.type_route === 'route'
                ? '🛣️ Route'
                : signalement.type_route === 'trottoir'
                ? '🚶 Trottoir'
                : signalement.type_route === 'pont'
                ? '🌉 Pont'
                : signalement.type_route === 'piste_cyclable'
                ? '🚴 Piste cyclable'
                : '❓ Autre'}
            </p>
          </section>
        )}
      </div>

      {/* Footer avec actions */}
      <div className="details-footer">
        <button onClick={() => navigate('/map')} className="btn-primary">
          📍 Voir sur la carte
        </button>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Fermer
        </button>
      </div>
    </div>
  );
}
