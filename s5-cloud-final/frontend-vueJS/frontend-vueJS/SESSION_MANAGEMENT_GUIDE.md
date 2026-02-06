# 📋 Guide de Gestion des Sessions

## Problème Identifié

Quand vous actualisiez la page, vous étiez **immédiatement déconnecté** car :
1. Vue.js redémarrait et Pinia se réinitialisait
2. Le store perdait l'info utilisateur en mémoire
3. Aucun mécanisme ne restaurait la session depuis le backend

## ✅ Solution Implémentée

### 1. **Persistance en localStorage** (authStore.ts)
```typescript
// Avant (stockage en mémoire RAM)
const token = ref<string | null>(localStorage.getItem('token'))

// Après (stockage durable)
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user', 
  SESSION_TIME: 'auth_session_time'
}

const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
const user = ref<User | null>(storedUser ? JSON.parse(storedUser) : null)
```

**Données persistées :**
- ✅ Token d'authentification
- ✅ Informations utilisateur (id, name, email, role, etc.)
- ✅ Timestamp de dernière session

### 2. **Restauration au Démarrage** (main.ts)
```typescript
// Au démarrage de l'app, AVANT de monter Vue
const authStore = useAuthStore()
await authStore.restoreSession().then(() => {
  app.mount('#app')  // Va récupérer l'user du backend
})
```

**Flux :**
1. ✅ Lire token depuis localStorage
2. ✅ Faire une requête `/api/user` pour valider la session
3. ✅ Restaurer l'user en mémoire Pinia
4. ✅ PUIS monter l'application Vue

### 3. **Gestion des Erreurs de Authentification**

#### Cas 1: Token valide (401 = Erreur d'authentification)
```typescript
if (err.response?.status === 401) {
  // Token expiré, supprimer tout
  token.value = null
  user.value = null
  localStorage.clear(STORAGE_KEYS)
  // Redirection automatique vers /login
}
```

#### Cas 2: Token invalide au démarrage
```typescript
const restoreSession = async () => {
  try {
    await fetchUser()  // Appel /api/user
    return true        // ✅ Session valide
  } catch (err) {
    return false       // ❌ Session invalide
  }
}
```

### 4. **Router Guard Amélioré** (router/index.ts)

**Avant :**
```typescript
// Appelé à CHAQUE navigation
if (authStore.token && !authStore.user) {
  await authStore.fetchUser()  // ❌ Lent et répétitif
}
```

**Après :**
```typescript
// Restaure UNE SEULE FOIS au démarrage
if (!authStore.sessionRestored) {
  await authStore.restoreSession()
}
```

---

## 🔄 Flux d'Authentification Complet

### Scénario 1: Connexion (Login)
```
[Utilisateur tape email/password]
         ↓
    login()
         ↓
POST /api/login
         ↓
[Réponse: token + user]
         ↓
localStorage.setItem(token)    ✅ Persiste
localStorage.setItem(user)     ✅ Persiste
Pinia store = user + token     ✅ Mémoire
```

### Scénario 2: Actualisation (F5)
```
[F5 appuyé]
         ↓
Vue.js redémarre
Pinia se réinitialise
         ↓
main.ts: restoreSession()
         ↓
                localStorage.getItem(token) → Lire le token
         ↓
GET /api/user avec Bearer token
         ↓
[Si 200 OK] ✅ Session valid
└─ user.value = response
└─ localStorage.user = updated
└─ Pinia store in-sync
         ↓
[Si 401 Unauthorized]
└─ Nettoyer localStorage
└─ Pinia.user = null
└─ Redirection /login
         ↓
app.mount() - L'app démarre
         ↓
[Router guard] - Vérifie isAuthenticated
```

### Scénario 3: Expiration de Session (Idle 2 heures)
```
[Utilisateur inactif depuis 2h]
Backend: Session expire
localStorage: Token toujours présent ❌
         ↓
[Utilisateur navigue / actualise]
         ↓
GET /api/user avec token expiré
         ↓
[401 Unauthorized]
Attraper l'erreur → Nettoyer localStorage
Redirection /login
         ↓
[Utilisateur doit relancer le login]
```

### Scénario 4: Déconnexion (Logout)
```
[Clic sur "Déconnexion"]
         ↓
POST /api/logout
         ↓
Nettoyer localStorage
Pinia.user = null
Pinia.token = null
         ↓
Redirection /login
```

---

## 🔍 Debugging: Vérifier l'État de la Session

### Console JavaScript (F12 → Console)
```javascript
// Vérifier les données persistées
localStorage.getItem('auth_token')      // Token ou null
localStorage.getItem('auth_user')       // JSON user ou null
localStorage.getItem('auth_session_time') // Timestamp

// Vérifier l'état Pinia en mémoire
import { useAuthStore } from '@/stores/authStore'
const auth = useAuthStore()
console.log(auth.user)         // Objet user ou null
console.log(auth.token)        // Token string ou null
console.log(auth.isAuthenticated) // true/false
console.log(auth.sessionRestored)  // true/false
```

### Logs de l'Application
```
// Démarrage réussi
🚀 Application démarrée avec session restaurée
✅ Session restaurée

// Session expiree
❌ Session expirée ou invalide
```

---

## 📊 Comparaison: Avant vs Après

| Aspect | Avant ❌ | Après ✅ |
|--------|----------|----------|
| **F5 = Déconnecté?** | OUI | NON |
| **Reload page** | Lose user data | ✓ Restore user |
| **Token persistence** | RAM only | localStorage |
| **Session check** | À chaque route | Une seule fois |
| **401 handling** | Déconnexion abuse | Smart cleanup |
| **Idle timeout** | Not managed | Proper logout |

---

## ⚙️ Configuration

### Clés localStorage utilisées
```javascript
'auth_token'         // Token d'authentification
'auth_user'          // Infos utilisateur (JSON)
'auth_session_time'  // Timestamp login
```

### Endpoints API requis
```
GET /api/user              // Récupérer l'utilisateur actuel + vérifier session
POST /api/login           // Se connecter
POST /api/logout          // Se déconnecter
POST /api/register        // Créer un compte
```

### Variables d'environnement (.env)
```
VITE_API_URL=http://localhost:8000/api
```

---

## 🚨 Troubleshoot

### "Je suis toujours déconnecté après F5"
1. Vérifier que `/api/user` retourne `200 OK` + user data
2. Vérifier le Authorization header: `Bearer <token>`
3. Lire les logs: `console.log()` or DevTools Network tab

### "J'ai l'impression d'être loggé mais pas les données utilisateur"
1. C'est normal au premier load : `sessionRestored` reste `false` le temps du fetch
2. Attendez le message: `✅ Session restaurée`
3. Puis la page se charge

### "Le logout ne net pas les données"
1. Assurer que `authService.logout()` appelle bien POST `/api/logout`
2. Le localStorage dOIT être vidé (voir code logout)
3. Vérifier les clés exactes: `'auth_token'`, `'auth_user'`, `'auth_session_time'`

---

## 📝 Notes de Développement

- La persistance utilise `localStorage` (synchrone, simple)
  - Alternative: Service Worker + IndexedDB (async, plus complexe)
- Le token Bearer est envoyé via `Authorization` header
  - Le cookie de session Laravel n'est plus utilisé côté frontend
- La restauration est faite UNE FOIS à l'app startup
  - Gain de perf: pas de fetch inutile à chaque route change
- `sessionRestored` flag prévient les race conditions

---

**Dernière mise à jour:** 6 Février 2026
