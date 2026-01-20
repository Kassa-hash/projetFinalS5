# Documentation d'Intégration - Système d'Authentification Vue.js

## Vue d'ensemble
Intégration complète d'un système d'authentification avec Vue.js 3, TypeScript, Pinia et Vue Router, connecté à une API Laravel avec Firebase + PostgreSQL.

---

## 📋 Table des matières
1. [Architecture mise en place](#architecture)
2. [Fichiers créés](#fichiers-créés)
3. [Fichiers modifiés](#fichiers-modifiés)
4. [Configuration](#configuration)
5. [Corrections et optimisations](#corrections)
6. [Structure finale](#structure-finale)

---

## 🏗️ Architecture

### Stack Technique
- **Frontend**: Vue 3.5.26 + TypeScript 5.9.3 + Vite 7.3.0
- **State Management**: Pinia 2.1.0
- **Routing**: Vue Router 4.4.0
- **HTTP Client**: Axios 1.7.0
- **Backend API**: Laravel 11 avec Firebase + PostgreSQL
- **Containerisation**: Docker avec node:20-alpine

### Flux d'Authentification
```
Utilisateur → Vue Component → Pinia Store → Axios Service → Laravel API → Firebase/PostgreSQL
```

### Rôles Utilisateurs
- **visitor**: Accès limité (non implémenté dans frontend)
- **user**: Dashboard utilisateur standard
- **manager**: Dashboard manager avec privilèges administratifs

---

## 📁 Fichiers créés

### 1. Services API (`src/services/authService.ts`)
**Rôle**: Gestion centralisée des appels API d'authentification

```typescript
- Configuration Axios avec baseURL depuis .env
- Intercepteur pour injection automatique du token Bearer
- Méthodes: register(), login(), logout(), getUser()
- Gestion centralisée des headers Authorization
```

### 2. Store Pinia (`src/stores/authStore.ts`)
**Rôle**: Gestion de l'état global d'authentification

```typescript
- State: user, token, loading, error
- Getters: isAuthenticated, userRole, isManager, isUser
- Actions: register, login, logout, fetchUser
- Persistance du token dans localStorage
- Support dual auth (Firebase + PostgreSQL)
```

### 3. Router (`src/router/index.ts`)
**Rôle**: Configuration des routes avec guards d'authentification

```typescript
Routes:
- / (public): Page d'accueil
- /login (guest): Page de connexion
- /register (guest): Page d'inscription
- /dashboard/user (auth + role): Dashboard utilisateur
- /dashboard/manager (auth + role): Dashboard manager
- /unauthorized (public): Erreur 403

Guards:
- beforeEach: Vérification authentification et rôles
- Redirection automatique selon statut auth
```
/
### 4. Composants

#### `src/components/LoginForm.vue`
- Formulaire de connexion (email + password)
- Validation en temps réel
- Affichage des erreurs API
- Redirection selon rôle après connexion
- Design responsive avec gradient violet

#### `src/components/RegisterForm.vue`
- Formulaire d'inscription complet
- Champs: name, email, phone, password, password_confirmation, role
- Validation des mots de passe identiques
- Sélecteur de rôle (user/manager)
- Design cohérent avec LoginForm

### 5. Vues

#### `src/views/LoginView.vue`
Wrapper pour le composant LoginForm

#### `src/views/RegisterView.vue`
Wrapper pour le composant RegisterForm

#### `src/views/HomeView.vue`
- Page d'accueil publique
- Section hero avec gradient
- Grid de 4 features (cartographie, auth, rôles, sync)
- CTA dynamiques selon statut authentification

#### `src/views/DashboardUserView.vue`
- Dashboard pour utilisateurs standard
- Affichage profil utilisateur
- Liste de fonctionnalités
- Cartes de statistiques

#### `src/views/DashboardManagerView.vue`
- Dashboard pour managers
- Contrôles administratifs
- Statistiques système
- Actions rapides

#### `src/views/UnauthorizedView.vue`
- Page 403 pour accès refusés
- Explication rôle manquant
- Bouton retour accueil

---

## 🔧 Fichiers modifiés

### 1. `src/main.ts`
**Modifications**:
```typescript
- Import et initialisation de Pinia: createPinia()
- Import et montage du Router
- Intégration dans la chaîne app.use()
```

### 2. `src/App.vue`
**Modifications**:
- Ajout d'une navbar complète avec navigation dynamique
- Menu conditionnel (authentifié vs invité)
- Affichage du nom utilisateur et rôle
- Bouton de déconnexion
- Structure: navbar + router-view

**Styles ajoutés**:
- Design navbar avec gradient violet
- Responsive avec media queries (768px, 480px)
- `box-sizing: border-box` global
- `min-width: 320px` sur #app
- Overflow-x hidden

### 3. `vite.config.ts`
**Modifications**:
```typescript
server: {
  host: '0.0.0.0',
  port: 5173,
  watch: {
    usePolling: true  // Important pour Docker
  }
}
// vueDevTools() commenté pour éviter erreurs Docker
```

### 4. `docker-compose.yml`
**Configuration**:
```yaml
service: vuejs_node
image: node:20-alpine
command: npm install && npm run dev -- --host 0.0.0.0
ports:
  - "5173:5173"
  - "3000:5173"
environment:
  - VITE_API_URL=http://localhost:8000/api
  - NODE_OPTIONS=--max-old-space-size=4096
volumes:
  - ./:/app
  # /app/node_modules NON monté (évite Bus errors)
```

### 5. `package.json`
**Dépendances ajoutées**:
```json
{
  "vue-router": "^4.4.0",
  "pinia": "^2.1.0",
  "axios": "^1.7.0"
}
```

### 6. `.env`
**Variable ajoutée**:
```
VITE_API_URL=http://localhost:8000/api
```

### 7. `src/assets/base.css`
**Modifications**:
- `font-size: 16px` sur body (au lieu de 15px)
- `margin: 0; padding: 0` sur body

### 8. `src/assets/main.css`
**Modifications**:
- Suppression de `#app { max-width: 1280px; margin: 0 auto; }`
- Suppression media query @1024px qui transformait le layout
- Conservation uniquement de `@import './base.css'`

---

## ⚙️ Configuration

### Backend Laravel
**Routes API** (`routes/api.php`):
```php
POST /api/login      - Connexion
POST /api/register   - Inscription (throttle 60/min)
POST /api/logout     - Déconnexion (auth:sanctum)
```

**Database Migration** (`0001_01_01_000000_create_users_table.php`):
```php
- firebase_uid (string, nullable, unique)
- name (string, nullable)
- email (string, unique)
- password (string)
- phone (string, nullable)
- role (enum: visitor, user, manager, default: user)
- account_lockout (boolean, default: false)
```

**Modèle User** (`app/Models/User.php`):
```php
$fillable = ['name', 'email', 'password', 'firebase_uid', 'phone', 'role', 'account_lockout']
$casts = ['account_lockout' => 'boolean']
```

### Frontend Vue.js
**Variables d'environnement** (`.env`):
```
VITE_API_URL=http://localhost:8000/api
```

**Import dans components**:
```typescript
import.meta.env.VITE_API_URL
```

---

## 🔨 Corrections et optimisations

### 1. Problèmes Docker résolus

#### Problème: Bus error sur node:20
**Solution**: 
- Migration vers `node:20-alpine` (plus léger)
- Suppression du volume `/app/node_modules` qui causait conflits

#### Problème: Port 8080 déjà utilisé
**Solution**: 
- Changement ports: `5173:5173` et `3000:5173`

#### Problème: Editor spawn error (vite-plugin-vue-devtools)
**Solution**: 
- Commenté `vueDevTools()` dans `vite.config.ts`
- Plugin tentait d'ouvrir VSCode depuis container

#### Problème: Hot reload ne fonctionne pas dans Docker
**Solution**: 
- Ajout `watch.usePolling: true` dans vite.config.ts
- Host: `0.0.0.0` au lieu de localhost

### 2. Problèmes UI résolus

#### Problème: Bandes noires sur les côtés (pages login/register)
**Solution**:
```css
.login-container, .register-container {
  width: 100%;
  margin: 0;
  box-sizing: border-box;
}
```

#### Problème: Pages rétrécies au centre
**Solution**:
- Suppression de `max-width: 1200px/1400px` sur containers
- Remplacement par `max-width: 100%` avec `padding: 0 5%`

#### Problème: Pas responsive (débordement horizontal)
**Solution**:
```css
#app {
  max-width: 100vw;
  overflow-x: hidden;
}

* {
  box-sizing: border-box;
}
```

#### Problème: Width + padding dépasse 100%
**Solution**:
- Ajout `box-sizing: border-box` sur tous les containers
- Garantit que padding est inclus dans width

#### Problème: Éléments éparpillés au zoom -90%
**Solution**:
```css
#app { min-width: 320px; }
.login-form { min-width: 280px; }
.features-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
}
```

#### Problème: Nécessite zoom 250% pour voir correctement
**Cause**: Conflit entre styles globaux de Vite
**Solution**:
- `font-size: 16px` sur body (au lieu de 15px)
- Suppression de `max-width: 1280px` sur #app dans main.css
- Suppression de la media query @1024px qui cassait le layout
- Ajout `margin: 0; padding: 0` sur body

### 3. Media Queries ajoutées

```css
/* Tablettes (max-width: 768px) */
- Navbar en colonne
- Formulaires width: 95%
- Textes réduits

/* Mobile (max-width: 480px) */
- Padding réduit
- Font-size plus petit
- Gap réduits dans grids
```

### 4. Migrations Database

#### Problème: Colonnes en doublon (role, phone)
**Cause**: Migrations redondantes après modification de create_users_table.php
**Solution**:
- Suppression de `2026_01_20_081959_add_phone_to_users_table.php`
- Suppression de `2026_01_20_000001_add_account_lockout_to_users_table.php`
- Exécution de `php artisan migrate:fresh`

---

## 📂 Structure finale

```
frontend-vueJS/frontend-vueJS/
├── src/
│   ├── main.ts (✏️ modifié - Pinia + Router)
│   ├── App.vue (✏️ modifié - Navbar + styles)
│   ├── router/
│   │   └── index.ts (✅ créé - Routes + guards)
│   ├── stores/
│   │   └── authStore.ts (✅ créé - State management)
│   ├── services/
│   │   └── authService.ts (✅ créé - API calls)
│   ├── components/
│   │   ├── LoginForm.vue (✅ créé)
│   │   └── RegisterForm.vue (✅ créé)
│   ├── views/
│   │   ├── HomeView.vue (✏️ modifié - Hero + features)
│   │   ├── LoginView.vue (✅ créé)
│   │   ├── RegisterView.vue (✅ créé)
│   │   ├── DashboardUserView.vue (✅ créé)
│   │   ├── DashboardManagerView.vue (✅ créé)
│   │   └── UnauthorizedView.vue (✅ créé)
│   └── assets/
│       ├── base.css (✏️ modifié - font-size 16px)
│       └── main.css (✏️ modifié - suppression styles conflictuels)
├── docker-compose.yml (✏️ modifié - node:20-alpine)
├── vite.config.ts (✏️ modifié - server config Docker)
├── package.json (✏️ modifié - deps ajoutées)
├── .env (✏️ modifié - VITE_API_URL)
├── IMPLEMENTATION_TODO.md (✅ créé - documentation technique)
└── SETUP_GUIDE.md (✅ créé - guide installation)
```

---

## 🎯 Fonctionnalités implémentées

### ✅ Authentification
- [x] Inscription avec validation
- [x] Connexion avec credentials
- [x] Déconnexion avec invalidation token
- [x] Persistance token localStorage
- [x] Auto-login au refresh si token valide

### ✅ Autorisation
- [x] Router guards pour routes protégées
- [x] Vérification rôles (user/manager)
- [x] Page 403 pour accès refusés
- [x] Redirection automatique selon rôle

### ✅ UI/UX
- [x] Design moderne avec gradients
- [x] Formulaires responsive
- [x] Navbar dynamique selon auth
- [x] Messages d'erreur clairs
- [x] Loading states sur boutons
- [x] Hover effects et transitions

### ✅ Responsive
- [x] Mobile-first approach
- [x] Media queries 768px et 480px
- [x] Grid adaptatif
- [x] Min-width pour éviter shrinking
- [x] Box-sizing cohérent

### ✅ Docker
- [x] Container node:20-alpine
- [x] Hot reload fonctionnel
- [x] Variables d'environnement
- [x] Ports mappés correctement

---

## 🚀 Commandes utiles

### Frontend
```bash
# Démarrer le dev server
cd frontend-vueJS/frontend-vueJS
docker-compose up

# Rebuild avec fresh deps
docker-compose down
docker-compose up --build

# Restart pour forcer rechargement
docker-compose restart
```

### Backend
```bash
# Migrations
docker exec laravel_app php artisan migrate

# Reset database
docker exec laravel_app php artisan migrate:fresh

# Status migrations
docker exec laravel_app php artisan migrate:status
```

### Accès
- Frontend: http://localhost:5173 ou http://localhost:3000
- Backend API: http://localhost:8000/api
- Database: PostgreSQL sur localhost:5432

---

## 📝 Notes importantes

### Sécurité
- Tokens stockés dans localStorage (non cryptés)
- CORS configuré côté Laravel
- Throttling sur route register (60 req/min)
- Validation côté client ET serveur

### Performance
- Lazy loading des routes possible
- Code splitting par défaut avec Vite
- Optimisation images à prévoir
- Cache API responses possible

### À faire
- [ ] Implémenter refresh token flow
- [ ] Ajouter 2FA (optionnel)
- [ ] Créer compte manager par défaut
- [ ] Configurer Firebase credentials
- [ ] Tester fallback PostgreSQL
- [ ] Ajouter fonctionnalités métier (cartes)
- [ ] Implémenter rôle "visitor"
- [ ] Tests unitaires
- [ ] Tests E2E

---

## 🐛 Problèmes connus

### Hard refresh nécessaire après changements CSS
**Cause**: Cache navigateur
**Solution**: Ctrl+Shift+R ou désactiver cache dans DevTools

### Docker pas de logs en temps réel
**Cause**: Buffering stdout
**Solution**: `docker-compose logs -f vuejs_node`

### Migrations déjà exécutées
**Cause**: Database persiste entre restarts
**Solution**: `php artisan migrate:fresh` pour reset complet

---

## 📚 Ressources

- [Vue 3 Documentation](https://vuejs.org)
- [Pinia Documentation](https://pinia.vuejs.org)
- [Vue Router Documentation](https://router.vuejs.org)
- [Axios Documentation](https://axios-http.com)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

**Date de création**: 20 janvier 2026  
**Dernière mise à jour**: 20 janvier 2026  
**Version**: 1.0.0
