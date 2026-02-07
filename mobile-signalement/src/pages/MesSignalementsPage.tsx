// Page affichant la liste des signalements de l'utilisateur
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMesSignalements } from '../services/syncService';
import { useNotifications } from '../contexts/NotificationContext';
import type { Probleme, StatutProbleme } from '../types';
import '../styles/MesSignalements.css';

const STATUT_LABELS: Record<StatutProbleme, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  termine: 'Terminé',
};

const STATUT_EMOJI: Record<StatutProbleme, string> = {
  nouveau: '🔴',
  en_cours: '🟡',
  termine: '🟢',
};

const TYPE_EMOJI: Record<string, string> = {
  nid_de_poule: '🕳️',
  fissure: '🔨',
  affaissement: '⬇️',
  autre: '❓',
};

export default function MesSignalementsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications();

  const [signalements, setSignalements] = useState<Probleme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'liste' | 'notifications'>('liste');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMesSignalements();
      setSignalements(data);
    } catch (err) {
      console.error('Erreur chargement signalements:', err);
      setError('Impossible de charger vos signalements.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
  };

  return (
    <div className="mes-signalements-page">
      {/* Header */}
      <header className="ms-header">
        <button className="ms-back-btn" onClick={() => navigate('/map')}>
          ← Carte
        </button>
        <h1>Mes signalements</h1>
        <button className="ms-add-btn" onClick={() => navigate('/add')}>
          +
        </button>
      </header>

      {/* Tabs */}
      <div className="ms-tabs">
        <button
          className={`ms-tab ${activeTab === 'liste' ? 'active' : ''}`}
          onClick={() => setActiveTab('liste')}
        >
          📋 Liste ({signalements.length})
        </button>
        <button
          className={`ms-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
          {unreadCount > 0 && <span className="ms-badge">{unreadCount}</span>}
        </button>
      </div>

      {/* Contenu */}
      <div className="ms-content">
        {activeTab === 'liste' && (
          <>
            {loading && (
              <div className="ms-loading">
                <div className="ms-spinner" />
                <p>Chargement...</p>
              </div>
            )}

            {error && (
              <div className="ms-error">
                <p>{error}</p>
                <button onClick={loadData}>Réessayer</button>
              </div>
            )}

            {!loading && !error && signalements.length === 0 && (
              <div className="ms-empty">
                <div className="ms-empty-icon">📭</div>
                <p>Aucun signalement pour le moment</p>
                <button onClick={() => navigate('/add')} className="ms-cta-btn">
                  Créer un signalement
                </button>
              </div>
            )}

            {!loading && !error && signalements.length > 0 && (
              <div className="ms-list">
                {signalements.map((s) => (
                  <div
                    key={s.firebase_id || s.id}
                    className={`ms-card ms-statut-${s.statut}`}
                    onClick={() =>
                      navigate('/map', {
                        state: { focusLat: s.latitude, focusLng: s.longitude },
                      })
                    }
                  >
                    <div className="ms-card-header">
                      <span className="ms-card-type">
                        {TYPE_EMOJI[s.type_probleme] || '❓'}
                      </span>
                      <div className="ms-card-title-area">
                        <h3>{s.titre}</h3>
                        <span className={`ms-statut-badge ms-statut-${s.statut}`}>
                          {STATUT_EMOJI[s.statut]} {STATUT_LABELS[s.statut]}
                        </span>
                      </div>
                    </div>
                    {s.description && (
                      <p className="ms-card-desc">{s.description}</p>
                    )}
                    {s.photos && s.photos.length > 0 && (
                      <div className="ms-card-photos">
                        {s.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo.url || photo.chemin}
                            alt={`Photo ${idx + 1}`}
                            className="ms-photo-thumb"
                          />
                        ))}
                      </div>
                    )}
                    <div className="ms-card-footer">
                      {s.adresse && (
                        <span className="ms-card-address">📍 {s.adresse}</span>
                      )}
                      <span className="ms-card-date">
                        {formatDate(s.date_signalement)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pull to refresh */}
            {!loading && (
              <button className="ms-refresh-btn" onClick={loadData}>
                🔄 Actualiser
              </button>
            )}
          </>
        )}

        {activeTab === 'notifications' && (
          <>
            {notifications.length > 0 && (
              <div className="ms-notif-actions">
                <button onClick={markAllAsRead}>✓ Tout marquer comme lu</button>
                <button onClick={clearAll} className="ms-notif-clear">
                  🗑️ Tout effacer
                </button>
              </div>
            )}

            {notifications.length === 0 && (
              <div className="ms-empty">
                <div className="ms-empty-icon">🔕</div>
                <p>Aucune notification</p>
                <p className="ms-empty-sub">
                  Vous serez notifié quand le statut d'un de vos signalements
                  changera.
                </p>
              </div>
            )}

            <div className="ms-notif-list">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`ms-notif-item ${n.lu ? 'ms-notif-read' : 'ms-notif-unread'}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="ms-notif-dot" />
                  <div className="ms-notif-content">
                    <p className="ms-notif-message">{n.message}</p>
                    <span className="ms-notif-time">{timeAgo(n.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
