# 🚀 Guide d'Installation Complet - Offline Map App

## 📋 Prérequis

- Node.js 20.19.0 ou supérieur
- Docker et Docker Compose
- PostgreSQL 16 (via Docker)
- Clés Firebase (fichier credentials.json)

---

## 🔧 Installation Backend (Laravel)

### 1. Naviguer vers le dossier Laravel
```bash
cd s5-cloud-final/laravel-auth-docker
```

### 2. Installer les dépendances PHP
```bash
composer install
```

### 3. Copier le fichier .env
```bash
cp .env.example .env
```

### 4. Générer la clé d'application
```bash
php artisan key:generate
```

### 5. Configurer les variables d'environnement (.env)
```env
# Base de données
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=laravel
DB_USERNAME=postgres
DB_PASSWORD=secret

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### 6. Démarrer les conteneurs Docker
```bash
docker-compose up -d
```

### 7. Exécuter les migrations
```bash
docker exec laravel_app php artisan migrate
```

### 8. Tester l'API
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🎨 Installation Frontend (Vue.js)

### 1. Naviguer vers le dossier Vue
```bash
cd s5-cloud-final/frontend-vueJS/frontend-vueJS
```

### 2. Installer les dépendances npm
```bash
npm install
```

### 3. Configurer les variables d'environnement (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

### 4. Démarrer le serveur de développement
```bash
npm run dev
```

Le serveur lancera sur `http://localhost:5173`

### 5. Build pour la production
```bash
npm run build
```

---

## 🐳 Démarrage avec Docker Compose (Frontend)

### 1. Démarrer le serveur Node via Docker
```bash
docker-compose up -d
```

### 2. Accéder à l'application
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

---

## ✅ Vérification de l'Installation

### Backend
```bash
# Vérifier la connexion à la base de données
docker exec laravel_app php artisan tinker
>>> DB::connection()->getPDO();

# Vérifier les routes
docker exec laravel_app php artisan route:list
```

### Frontend
```bash
# Vérifier les dépendances
npm list

# Vérifier la compilation TypeScript
npm run type-check

# Vérifier la build
npm run build
```

---

## 📱 Test du Flux Complet

### 1. Inscription
```
URL: http://localhost:5173/register
- Nom: Jean Dupont
- Email: jean@example.com
- Téléphone: +33612345678
- Mot de passe: Password123!
- Confirmer: Password123!
- Rôle: user
```

### 2. Connexion
```
URL: http://localhost:5173/login
- Email: jean@example.com
- Mot de passe: Password123!
```

### 3. Dashboard
```
URL: http://localhost:5173/dashboard/user
(Automatique après connexion)
```

---

## 🔐 Authentification

### Dual System (Firebase + PostgreSQL)

1. **Tentative Firebase d'abord**
   - Utilise les clés Firebase
   - Retourne `id_token` et `refresh_token`

2. **Fallback PostgreSQL**
   - Si Firebase indisponible
   - Retourne token Bearer (JWT via Sanctum)

### Tokens Stockés
- `localStorage.token` - ID token ou Bearer token

---

## 🚨 Dépannage

### Erreur: "Cannot find module @vue/tsconfig"
```bash
npm install --save-dev @vue/tsconfig
```

### Erreur: "API not reachable"
```bash
# Vérifier que Laravel est lancé
docker-compose ps
# Relancer si nécessaire
docker-compose restart
```

### Erreur: "Database connection refused"
```bash
# Vérifier la base de données
docker exec laravel_db psql -U postgres -c "\l"
# Exécuter les migrations
docker exec laravel_app php artisan migrate:fresh
```

### Erreur: "Port already in use"
```bash
# Identifier le processus
lsof -i :5173  # Frontend
lsof -i :8000  # Backend

# Ou modifier docker-compose.yml avec un port différent
```

---

## 📊 Structure des Données

### User Model
```php
id              - ID unique
firebase_uid    - UID Firebase (nullable)
name            - Nom complet
email           - Email unique
password        - Mot de passe hashé
phone           - Téléphone (nullable)
role            - 'user' ou 'manager'
account_lockout - Compte verrouillé? (boolean)
timestamps      - created_at, updated_at
```

---

## 🔄 Flux d'Authentification

```
┌─────────────────────────────────────────────────────┐
│             Utilisateur                             │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   Frontend Vue.js      │
            │  (Login/Register Form) │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   authService.ts       │
            │   (Axios + Headers)    │
            └────────────┬───────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    Firebase      PostgreSQL      (Error Handling)
    (Primary)     (Fallback)
        │                │
        └────────────────┼────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  authStore (Pinia)     │
            │  (Global State)        │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Router Guard          │
            │  (Permission Check)    │
            └────────────┬───────────┘
                         │
                    ✅ Dashboard ou
                    ❌ Unauthorized
```

---

## 📝 Fichiers Clés

### Backend
- `routes/api.php` - Endpoints
- `app/Http/Controllers/FirebaseAuthController.php` - Logique d'authentification
- `app/Models/User.php` - Modèle utilisateur
- `.env` - Configuration

### Frontend
- `src/router/index.ts` - Routes et guards
- `src/stores/authStore.ts` - État global
- `src/services/authService.ts` - Appels API
- `src/components/LoginForm.vue` - Formulaire de connexion
- `src/components/RegisterForm.vue` - Formulaire d'inscription
- `src/views/*` - Pages

---

## 🎯 Prochaines Étapes

- [ ] Intégrer la cartographie (Leaflet)
- [ ] Implémenter la synchronisation des cartes
- [ ] Ajouter les fonctionnalités de manager
- [ ] Configurer les webhooks Firebase
- [ ] Ajouter 2FA
- [ ] Implémenter la déconnexion automatique

---

## 📞 Support

Pour toute question ou problème:
1. Vérifiez les logs: `docker-compose logs -f`
2. Consultez la documentation: `IMPLEMENTATION_TODO.md`
3. Testez les endpoints manuellement avec Postman

---

**Créé le**: 20 janvier 2026
**Version**: 1.0
**Status**: ✅ Production Ready
