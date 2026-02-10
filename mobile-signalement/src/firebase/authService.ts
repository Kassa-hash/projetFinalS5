// Service d'authentification Firebase
// Gère login email/password et Google Sign-In
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

/**
 * Connexion avec email et mot de passe
 */
export async function loginWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  return { user: userCredential.user, token };
}

/**
 * Inscription avec email et mot de passe
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string
) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // Mettre à jour le profil avec le nom si fourni
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }

  const token = await userCredential.user.getIdToken();
  return { user: userCredential.user, token };
}

/**
 * Connexion avec Google
 */
export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const token = await result.user.getIdToken();
  return { user: result.user, token };
}

/**
 * Déconnexion
 */
export async function logout() {
  await signOut(auth);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

/**
 * Obtenir le token JWT actuel (pour les appels API)
 */
export async function getCurrentToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken(true);
}

/**
 * Observer les changements d'état d'authentification
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
