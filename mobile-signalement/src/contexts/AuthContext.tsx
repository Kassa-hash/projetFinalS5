// Contexte d'authentification React
// Gère l'état global de l'utilisateur connecté
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { type User as FirebaseUser } from 'firebase/auth';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logout as firebaseLogout,
  onAuthChange,
} from '../firebase/authService';
import { initializePushNotifications } from '../services/pushNotificationService';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('auth_token')
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Observer Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        setToken(idToken);
        localStorage.setItem('auth_token', idToken);
        setUser({
          id: 0, // L'ID réel viendrait du backend
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Utilisateur',
          email: fbUser.email || '',
          role: 'user',
        });
        // Initialiser les notifications push
        await initializePushNotifications();
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { user: fbUser, token: idToken } = await loginWithEmail(email, password);
      setToken(idToken);
      localStorage.setItem('auth_token', idToken);
      setUser({
        id: 0,
        name: fbUser.displayName || email.split('@')[0],
        email: fbUser.email || email,
      });
    } catch (err: unknown) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);
      const { user: fbUser, token: idToken } = await registerWithEmail(
        email,
        password,
        name
      );
      setToken(idToken);
      localStorage.setItem('auth_token', idToken);
      setUser({
        id: 0,
        name: fbUser.displayName || name,
        email: fbUser.email || email,
      });
    } catch (err: unknown) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { user: fbUser, token: idToken } = await loginWithGoogle();
      setToken(idToken);
      localStorage.setItem('auth_token', idToken);
      setUser({
        id: 0,
        name: fbUser.displayName || 'Utilisateur Google',
        email: fbUser.email || '',
      });
    } catch (err: unknown) {
      const message = getFirebaseErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
      setToken(null);
      setFirebaseUser(null);
    } catch (err: unknown) {
      console.error('Erreur lors de la déconnexion:', err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        error,
        login,
        register,
        googleLogin,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook personnalisé pour accéder au contexte d'auth
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}

/**
 * Traduit les codes d'erreur Firebase en messages français
 */
function getFirebaseErrorMessage(err: unknown): string {
  const error = err as { code?: string; message?: string };
  switch (error.code) {
    case 'auth/user-not-found':
      return 'Aucun compte trouvé avec cet email.';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect.';
    case 'auth/invalid-credential':
      return 'Email ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Un compte existe déjà avec cet email.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez plus tard.';
    case 'auth/popup-closed-by-user':
      return 'Connexion annulée.';
    case 'auth/network-request-failed':
      return 'Erreur réseau. Vérifiez votre connexion.';
    default:
      return error.message || 'Une erreur est survenue.';
  }
}
