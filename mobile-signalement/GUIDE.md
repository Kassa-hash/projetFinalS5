# 📱 Signalement Mobile - Guide Complet

## 📋 Table des matières

1. [Présentation du projet](#-présentation)
2. [Architecture technique](#-architecture-technique)
3. [Structure des fichiers](#-structure-des-fichiers)
4. [Prérequis](#-prérequis)
5. [Installation](#-installation)
6. [Configuration Firebase](#-configuration-firebase)
7. [Lancement en développement](#-lancement-en-développement)
8. [Build et déploiement Android](#-build-et-déploiement-android)
9. [Fonctionnalités détaillées](#-fonctionnalités-détaillées)
10. [Résolution de problèmes](#-résolution-de-problèmes)

---

## 🎯 Présentation

Application mobile de **signalement de problèmes routiers** à Antananarivo, construite avec :

| Technologie | Rôle |
|---|---|
| **React 19** + TypeScript | Framework UI |
| **Vite** | Bundler et serveur de dev |
| **Capacitor 8** | Bridge natif mobile (Android/iOS) |
| **Firebase Auth** | Authentification (Email + Google) |
| **Leaflet** | Carte interactive OpenStreetMap |
| **Axios** | Client HTTP vers le backend Laravel |

L'app partage le **même projet Firebase** et la **même API Backend** que l'application web VueJS existante.

---

## 🏗 Architecture technique

```
┌─────────────────────────────────────────────────┐
│                 Application Mobile              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │  Login   │  │ Register │  │   Map Page    │ │
│  │  Page    │  │  Page    │  │  (Leaflet)    │ │
│  └────┬─────┘  └────┬─────┘  └───────┬───────┘ │
│       │              │                │         │
│  ┌────┴──────────────┴────────────────┴───────┐ │
│  │           AuthContext (React Context)       │ │
│  └────────────────────┬───────────────────────┘ │
│                       │                         │
│  ┌────────────────────┴───────────────────────┐ │
│  │        Firebase Auth SDK (Client)          │ │
│  └────────────────────┬───────────────────────┘ │
│                       │                         │
│  ┌────────────────────┴───────────────────────┐ │
│  │           Axios (API Client)               │ │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │         Capacitor (Bridge Natif)         │   │
│  │  • Geolocation  • StatusBar  • Keyboard  │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│   Backend Laravel (localhost:8000/api)          │
│   + Firebase Admin SDK + PostgreSQL             │
└─────────────────────────────────────────────────┘
```

### Flux d'authentification

1. L'utilisateur entre email/password ou clique "Google"
2. Firebase Auth SDK authentifie côté client
3. Un `id_token` JWT est obtenu
4. Le token est stocké dans `localStorage`
5. Les appels API vers Laravel incluent le token en `Bearer`
6. Laravel valide le token via Firebase Admin SDK

---

## 📁 Structure des fichiers

```
mobile-signalement/
├── android/                    # Projet Android natif (généré par Capacitor)
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                # Point d'entrée React
│   ├── App.tsx                 # Composant racine (AuthProvider + Router)
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx      # État global d'authentification
│   │
│   ├── firebase/
│   │   ├── config.ts           # Init Firebase (app + auth + firestore)
│   │   └── authService.ts      # Fonctions d'auth (login, register, google, logout)
│   │
│   ├── services/
│   │   ├── api.ts              # Client Axios avec intercepteurs
│   │   └── problemesService.ts # CRUD des problèmes via l'API Laravel
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx       # Page de connexion
│   │   ├── RegisterPage.tsx    # Page d'inscription
│   │   └── MapPage.tsx         # Page carte Leaflet avec marqueurs
│   │
│   ├── components/
│   │   └── ProtectedRoute.tsx  # Guard de route authentifiée
│   │
│   ├── router/
│   │   └── index.tsx           # Configuration des routes
│   │
│   ├── styles/
│   │   ├── global.css          # Styles globaux + reset CSS
│   │   ├── Auth.css            # Styles pages login/register
│   │   └── Map.css             # Styles page carte + marqueurs + popups
│   │
│   └── types/
│       └── index.ts            # Interfaces TypeScript partagées
│
├── .env                        # Variables d'environnement (Firebase config)
├── .env.example                # Template des variables
├── capacitor.config.ts         # Configuration Capacitor
├── index.html                  # HTML d'entrée (optimisé mobile)
├── package.json                # Dépendances et scripts
├── tsconfig.json               # Configuration TypeScript
└── vite.config.ts              # Configuration Vite
```

---

## ⚙️ Prérequis

| Outil | Version minimale | Vérification |
|---|---|---|
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **Android Studio** | 2023+ | (pour build Android) |
| **JDK** | 17+ | `java --version` |

> **Note :** Android Studio est nécessaire uniquement pour compiler l'APK. Le développement web fonctionne sans.

---

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd mobile-signalement
npm install
```

### 2. Configurer les variables d'environnement

Le fichier `.env` est déjà configuré avec les mêmes identifiants Firebase que l'application VueJS. Si tu as besoin de les modifier :

```bash
# Copier le template
cp .env.example .env

# Éditer avec tes propres valeurs Firebase
```

### 3. Vérifier que tout compile

```bash
npm run build
```

---

## 🔥 Configuration Firebase

### Projet Firebase utilisé

| Paramètre | Valeur |
|---|---|
| Project ID | `cloud-807c9` |
| Auth Domain | `cloud-807c9.firebaseapp.com` |

### Méthodes d'authentification activées

Dans la [console Firebase](https://console.firebase.google.com/project/cloud-807c9/authentication/providers), vérifie que ces providers sont activés :

1. ✅ **Email/Password** - Activé
2. ✅ **Google** - Activé (nécessite la configuration du client OAuth)

### Configuration Google Sign-In (important !)

Pour que Google Sign-In fonctionne sur Android :

1. Va dans **Firebase Console > Authentication > Sign-in method > Google**
2. Active le provider Google
3. Va dans **Project Settings > General**
4. Ajoute le **SHA-1** de ton keystore Android :
   ```bash
   cd android
   ./gradlew signingReport
   ```
5. Copie le SHA-1 affiché et ajoute-le dans Firebase Console

---

## 💻 Lancement en développement

### Mode Web (navigateur)

```bash
npm run dev
```

L'app sera accessible sur `http://localhost:5173`

### Mode Android (avec live reload)

1. Décommenter l'URL du serveur dans `capacitor.config.ts` :
   ```typescript
   server: {
     url: 'http://192.168.x.x:5173', // Remplace par ton IP locale
   }
   ```

2. Trouver ton IP locale :
   ```bash
   ipconfig    # Windows
   ifconfig    # Mac/Linux
   ```

3. Lancer le serveur Vite :
   ```bash
   npm run dev -- --host
   ```

4. Ouvrir Android Studio :
   ```bash
   npm run cap:android
   ```

5. Lancer l'app depuis Android Studio sur un émulateur ou appareil connecté

---

## 📦 Build et déploiement Android

### Build complet

```bash
# Build web + synchronisation Capacitor
npm run cap:build
```

### Ouvrir dans Android Studio

```bash
npm run cap:android
```

Depuis Android Studio :
1. **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. L'APK sera dans `android/app/build/outputs/apk/debug/`

### Build en une commande (si un appareil/émulateur est connecté)

```bash
npm run cap:run:android
```

---

## ✨ Fonctionnalités détaillées

### 🔐 Authentification

- **Email/Password** : Formulaires de login et inscription classiques
- **Google Sign-In** : Authentification OAuth via popup
- **Persistance** : Session maintenue entre les redémarrages (localStorage + Firebase persistence)
- **Route Guard** : Redirection automatique vers `/login` si non authentifié
- **Messages d'erreur** : Traduits en français (mot de passe incorrect, email déjà utilisé, etc.)

### 🗺️ Carte Leaflet

- **Tuiles OpenStreetMap** : Carte par défaut centrée sur Antananarivo (-18.8792, 47.5079)
- **Marqueurs colorés** : 
  - 🔴 Rouge = Nouveau
  - 🟡 Jaune = En cours
  - 🟢 Vert = Terminé
- **Popups détaillés** : Titre, type, description, statut, date, adresse
- **Filtrage** : Par statut (nouveau, en cours, terminé)
- **Géolocalisation** : Position GPS de l'utilisateur avec animation pulse
- **Responsive** : Adapté aux écrans mobiles avec safe areas iOS/Android

### 📡 API Backend

L'app communique avec le backend Laravel via Axios :

| Endpoint | Usage |
|---|---|
| `GET /api/problemes` | Liste des signalements |
| `GET /api/problemes/:id` | Détail d'un signalement |
| `GET /api/problemes/:id/photos` | Photos d'un signalement |
| `GET /api/dashboard` | Statistiques |

---

## 🔧 Résolution de problèmes

### "Firebase: Error (auth/invalid-api-key)"

→ Vérifie que le fichier `.env` contient les bonnes valeurs et que le serveur Vite a été redémarré après modification.

### Les marqueurs n'apparaissent pas

→ Vérifie que :
1. Le backend Laravel (`localhost:8000`) est bien démarré
2. CORS autorise `http://localhost:5173` (déjà configuré dans le backend)
3. Les problèmes existent dans la base de données

### Google Sign-In ne fonctionne pas sur Android

→ Vérifie que :
1. Le SHA-1 de debug est ajouté dans Firebase Console
2. Le provider Google est activé dans Authentication
3. Le fichier `google-services.json` est à jour dans `android/app/`

### Géolocalisation ne fonctionne pas

→ Sur navigateur : HTTPS obligatoire (ou localhost)  
→ Sur Android : Vérifie les permissions dans les paramètres de l'app  
→ Sur émulateur : Configure une position GPS dans "Extended controls > Location"

### Erreur CORS avec l'API

→ Ajoute `http://localhost:5173` dans la configuration CORS du backend Laravel (`config/cors.php`)

### Build Android échoue

```bash
# Nettoyer et reconstruire
cd android
./gradlew clean
cd ..
npm run cap:build
```

---

## 📝 Scripts disponibles

| Script | Commande | Description |
|---|---|---|
| `npm run dev` | `vite` | Serveur de dev web |
| `npm run build` | `tsc -b && vite build` | Build de production |
| `npm run preview` | `vite preview` | Prévisualiser le build |
| `npm run lint` | `eslint .` | Vérifier le code |
| `npm run cap:sync` | `npx cap sync` | Synchroniser web → natif |
| `npm run cap:android` | `npx cap open android` | Ouvrir dans Android Studio |
| `npm run cap:build` | `build + sync` | Build complet pour mobile |
| `npm run cap:run:android` | `build + sync + run` | Build et lancer sur appareil |

---

## 🔗 Liens avec le projet existant

Cette application mobile partage avec l'application web VueJS :
- ✅ Le même projet Firebase (`cloud-807c9`)
- ✅ La même API Backend Laravel (`localhost:8000/api`)
- ✅ Les mêmes types de données (Problème, Photo, Statut, etc.)
- ✅ Les mêmes endpoints API
- ✅ Le même flux d'authentification Firebase
