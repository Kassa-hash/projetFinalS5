# Intégration Authentification Firebase + PostgreSQL dans Vue.js

## ✅ Étapes Complétées

### 1. Backend Laravel (API)

#### 1.1 Migration Database ✅
- Fichier: `database/migrations/0001_01_01_000000_create_users_table.php`
- Modifications:
  - Ajout du champ `firebase_uid` (unique, nullable)
  - Changement `name` en nullable
  - Ajout du champ `phone` (nullable, max:20)
  - Ajout du champ `role` (enum: visitor, user, manager)
  - Ajout du champ `account_lockout` (boolean, default false)

#### 1.2 Modèle User ✅
- Fichier: `app/Models/User.php`
- Modifications:
  - `$fillable` mis à jour avec: firebase_uid, phone, role, account_lockout
  - `casts` updated pour account_lockout (boolean)
  - Suppression des champs anciens (login_attempts, locked_until)

#### 1.3 FirebaseAuthController ✅
- Fichier: `app/Http/Controllers/FirebaseAuthController.php`
- Méthode `login()`:
  - Authentification Firebase en premier
  - Si réussi: récupère/crée utilisateur local et retourne user complet + tokens
  - Fallback PostgreSQL si Firebase indisponible
  - Vérification du lockout de compte
  - Messages d'erreur en français

- Méthode `register()`:
  - Validation complète (name, email, password:confirmed, phone, role)
  - Création Firebase en premier
  - Synchronisation vers PostgreSQL
  - Fallback PostgreSQL si Firebase indisponible
  - Retourne user avec tous les champs (role, phone, etc.)

- Méthode `logout()`:
  - Invalidation du token côté serveur

#### 1.4 Routes API ✅
- Fichier: `routes/api.php`
- Routes ajoutées:
  - `POST /login` - Connexion (throttle 60/min)
  - `POST /register` - Inscription (throttle 60/min)
  - `POST /logout` - Déconnexion (auth:sanctum)
- Suppression des routes `/firebase/login` et `/firebase/register`

---

### 2. Frontend Vue.js

#### 2.1 Service Authentification ✅
- Fichier: `src/services/authService.ts`
- Fonctionnalités:
  - Instance axios préconfigurée
  - URL API depuis `.env` (VITE_API_URL)
  - Intercepteur pour injecter le token Bearer
  - Méthodes: register(), login(), logout(), getUser()
  - Gestion des deux sources de réponse (Firebase + Postgres)

#### 2.2 Store Pinia ✅
- Fichier: `src/stores/authStore.ts`
- État global:
  - `user` (User | null)
  - `token` (string | null)
  - `loading` (boolean)
  - `error` (string | null)
  
- Computed properties:
  - `isAuthenticated`: Vérification du token et utilisateur
  - `userRole`: Rôle de l'utilisateur
  - `isManager`: Vérification si manager
  - `isUser`: Vérification si utilisateur

- Actions:
  - `register()`: Inscription avec validation
  - `login()`: Connexion avec gestion des deux sources
  - `logout()`: Déconnexion sécurisée
  - `fetchUser()`: Récupération de l'utilisateur
  - `clearError()`: Effacement des erreurs

#### 2.3 Composant LoginForm ✅
- Fichier: `src/components/LoginForm.vue`
- Fonctionnalités:
  - Formulaire email + password
  - Affichage des erreurs
  - Redirection selon le rôle (manager/user)
  - Design gradient modern
  - Lien vers inscription

#### 2.4 Composant RegisterForm ✅
- Fichier: `src/components/RegisterForm.vue`
- Fonctionnalités:
  - Formulaire complet (name, email, phone, password, role)
  - Confirmation du mot de passe
  - Sélection du rôle (user/manager)
  - Validation client
  - Design cohérent avec login
  - Lien vers connexion

#### 2.5 Router Configuration ✅
- Fichier: `src/router/index.ts`
- Routes:
  - `/` - Home (publique)
  - `/login` - Page de connexion (guest only)
  - `/register` - Page d'inscription (guest only)
  - `/dashboard/user` - Dashboard utilisateur (auth + role user)
  - `/dashboard/manager` - Dashboard manager (auth + role manager)
  - `/unauthorized` - Page d'erreur 403

- Guards:
  - Récupération auto de l'utilisateur au démarrage
  - Vérification de l'authentification
  - Vérification des rôles requis
  - Redirection des invités authentifiés

#### 2.6 Configuration Environnement ✅
- Fichier: `.env`
- Variables:
  - `VITE_API_URL`: URL de l'API Laravel

---

## 📋 Flux d'Authentification

### Login Flow:
1. Utilisateur entre email + password
2. Envoi à `POST /login`
3. Backend essaie Firebase en premier
4. Si Firebase OK: retourne id_token + user complet
5. Si Firebase KO: fallback PostgreSQL avec token Bearer
6. Frontend stocke token dans localStorage
7. Redirection selon le rôle

### Register Flow:
1. Utilisateur remplit le formulaire
2. Validation client (passwords match + role selected)
3. Envoi à `POST /register`
4. Backend crée dans Firebase en premier
5. Synchronisation vers PostgreSQL
6. Si Firebase KO: fallback PostgreSQL uniquement
7. Retour de l'utilisateur créé + tokens
8. Auto-connexion après inscription

---

## 🔐 Rôles et Permissions

- **Visiteur**: Pas de compte, accès aux pages publiques uniquement
- **Utilisateur**: Compte créé via inscription, accès au dashboard utilisateur
- **Manager**: Compte créé via inscription, accès au dashboard manager

---

## 📝 Prochaines Étapes

### À faire:
- [ ] Créer les vues (HomeView.vue, LoginView.vue, RegisterView.vue, DashboardUserView.vue, DashboardManagerView.vue, UnauthorizedView.vue)
- [ ] Configurer Pinia dans main.ts
- [ ] Configurer Vue Router dans main.ts
- [ ] Ajouter les pages des dashboards avec contenu métier
- [ ] Ajouter la persistance du rôle utilisateur
- [ ] Tester Firebase avec des clés d'authentification réelles
- [ ] Ajouter refresh token automatique
- [ ] Ajouter 2FA si nécessaire
- [ ] Implémenter la déconnexion automatique après inactivité

---

## 🚀 Installation des Dépendances

```bash
npm install pinia axios vue-router
```

---

## 📖 Structure des Fichiers

```
Frontend Vue.js/
├── src/
│   ├── services/
│   │   └── authService.ts          ✅ Service API
│   ├── stores/
│   │   └── authStore.ts            ✅ Store Pinia
│   ├── components/
│   │   ├── LoginForm.vue           ✅ Formulaire connexion
│   │   └── RegisterForm.vue        ✅ Formulaire inscription
│   ├── router/
│   │   └── index.ts                ✅ Configuration routes
│   ├── views/
│   │   ├── HomeView.vue            ⏳ À créer
│   │   ├── LoginView.vue           ⏳ À créer
│   │   ├── RegisterView.vue        ⏳ À créer
│   │   ├── DashboardUserView.vue   ⏳ À créer
│   │   ├── DashboardManagerView.vue ⏳ À créer
│   │   └── UnauthorizedView.vue    ⏳ À créer
│   └── App.vue                     ⏳ À mettre à jour
├── .env                             ✅ Variables d'environnement
└── package.json                     ✅ Dépendances

Backend Laravel/
├── database/
│   └── migrations/
│       └── 0001_01_01_000000_create_users_table.php ✅
├── app/
│   ├── Models/
│   │   └── User.php                ✅
│   └── Http/
│       └── Controllers/
│           └── FirebaseAuthController.php ✅
└── routes/
    └── api.php                     ✅
```

---

## 🔗 API Endpoints

### Public
- `POST /api/login` - Connexion
- `POST /api/register` - Inscription

### Protected (auth:sanctum)
- `POST /api/logout` - Déconnexion

---

## 💾 Réponses API

### Login Success (Firebase)
```json
{
  "source": "firebase",
  "token_type": "Bearer",
  "id_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "uid": "firebase_uid",
  "user": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean@example.com",
    "role": "user",
    "phone": "0612345678",
    "account_lockout": false
  }
}
```

### Register Success
```json
{
  "source": "firebase|postgres",
  "message": "Utilisateur créé avec succès",
  "id_token": "...",
  "refresh_token": "...",
  "uid": "firebase_uid",
  "user": { ... }
}
```

---

**Créé le**: 20 janvier 2026
**Dernière mise à jour**: 20 janvier 2026
**Statut**: 🟢 Backend + Frontend de base complétés
