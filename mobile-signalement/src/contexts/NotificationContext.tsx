// Contexte de notifications temps réel
// Écoute les changements de statut des signalements de l'utilisateur via Firestore
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAuth } from './AuthContext';
import {
  ecouterMesSignalements,
  type StatutChange,
} from '../services/syncService';

export interface Notification {
  id: string;
  titre: string;
  message: string;
  type: 'statut_change';
  lu: boolean;
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'signalement_notifications';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STATUT_LABELS: Record<string, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  termine: 'Terminé',
};

function loadNotifications(): Notification[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifs: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications);
  const notifIdCounter = useRef(1);

  // Persister les notifications dans localStorage
  useEffect(() => {
    saveNotifications(notifications);
  }, [notifications]);

  // Demander la permission pour les notifications système Android
  useEffect(() => {
    (async () => {
      try {
        const perm = await LocalNotifications.checkPermissions();
        console.log('🔔 Permissions notifications:', perm);
        if (perm.display !== 'granted') {
          const result = await LocalNotifications.requestPermissions();
          console.log('🔔 Permission demandée:', result);
        }
      } catch (err) {
        console.warn('⚠️ Erreur permissions notifications:', err);
      }
    })();
  }, []);

  // Écouter les changements de statut en temps réel
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = ecouterMesSignalements((change: StatutChange) => {
      const newNotif: Notification = {
        id: `${change.id}_${change.timestamp}`,
        titre: change.titre,
        message: `Le statut de "${change.titre}" est passé de ${STATUT_LABELS[change.ancienStatut] || change.ancienStatut} à ${STATUT_LABELS[change.nouveauStatut] || change.nouveauStatut}`,
        type: 'statut_change',
        lu: false,
        timestamp: change.timestamp,
      };

      setNotifications((prev) => [newNotif, ...prev].slice(0, 50));

      // Afficher une vraie notification système Android via Capacitor
      const localId = notifIdCounter.current++;
      LocalNotifications.schedule({
        notifications: [
          {
            title: '📍 Signalement mis à jour',
            body: newNotif.message,
            id: localId,
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      }).catch((err: unknown) => {
        console.error('❌ Erreur notification locale:', err);
      });

      console.log('📬 Notification envoyée (ID:', localId, ')');
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, lu: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.lu).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé dans NotificationProvider');
  }
  return context;
}
