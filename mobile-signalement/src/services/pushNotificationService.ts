// Service de notifications push via Firebase Cloud Messaging
// Gère les notifications système sur Android/iOS
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export interface PushMessage {
  title?: string;
  body?: string;
  data?: unknown;
}

/**
 * Initialiser les notifications push
 * Demande les permissions, récupère le token, et configure l'écoute
 */
export async function initializePushNotifications(
  onMessageCallback?: (message: PushMessage) => void
): Promise<void> {
  try {
    // Demander les permissions
    const permission = await FirebaseMessaging.requestPermissions();
    console.log('🔔 Push notifications permission:', permission.receive);

    if (permission.receive !== 'granted') {
      console.warn('⚠️ Notifications push non autorisées');
      return;
    }

    // Récupérer le device token FCM
    const { token } = await FirebaseMessaging.getToken();
    console.log('📱 FCM Device token:', token);

    // Sauvegarder le token pour cet utilisateur dans Firestore
    if (auth.currentUser && token) {
      await storeDeviceToken(token);
    }

    // Écouter les nouveaux tokens (peut changer)
    await FirebaseMessaging.addListener('tokenReceived', async (event) => {
      console.log('🔄 Nouveau FCM token:', event.token);
      if (auth.currentUser) {
        await storeDeviceToken(event.token);
      }
    });

    // Écouter les messages entrants quand l'app est au premier plan
    await FirebaseMessaging.addListener('notificationReceived', (event) => {
      console.log('📬 Notification reçue (foreground):', event.notification);

      if (onMessageCallback) {
        onMessageCallback({
          title: event.notification.title,
          body: event.notification.body,
          data: event.notification.data,
        });
      }
    });

    // Écouter quand l'utilisateur tapote sur une notification
    await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      console.log('👆 Notification cliquée:', event.notification);
    });

    console.log('✅ Push notifications initialisées');
  } catch (err) {
    console.error('❌ Erreur initialisation push notifications:', err);
  }
}

/**
 * Sauvegarder le device token dans Firestore
 */
async function storeDeviceToken(token: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    const usersRef = collection(db, 'users');
    const userDocRef = doc(usersRef, uid);

    await setDoc(
      userDocRef,
      {
        device_token: token,
        email: auth.currentUser?.email || '',
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log('✅ Device token stocké dans Firestore');
  } catch (err) {
    console.error('❌ Erreur stockage device token:', err);
  }
}

/**
 * Récupérer le device token FCM actuel
 */
export async function getDeviceToken(): Promise<string | null> {
  try {
    const { token } = await FirebaseMessaging.getToken();
    return token || null;
  } catch {
    return null;
  }
}
