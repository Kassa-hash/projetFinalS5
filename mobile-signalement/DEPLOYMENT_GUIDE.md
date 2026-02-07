# Guide de Déploiement - Application Mobile Signalement

## Vue d'ensemble
Application mobile React + Capacitor pour signaler des problèmes routiers avec synchronisation Firebase et notifications en temps réel.

**Stack technique :**
- Frontend : React 19 + TypeScript + Vite
- Mobile : Capacitor 8 Android
- Backend : Firebase (Auth + Firestore + Cloud Messaging)
- API : Laravel (fallback pour données)


---

## 1. PRÉREQUIS - Installation sur la machine

### 1.1 Node.js et npm
```bash
# Télécharger depuis https://nodejs.org/
# Version recommandée : LTS 18+
# Vérifier l'installation :
node --version  # v18.x.x ou plus
npm --version   # 10.x.x ou plus
```

### 1.2 Java Development Kit (JDK)
```bash
# Android Studio inclut JDK
# OU télécharger séparément depuis https://www.oracle.com/java/technologies/javase/jdk21-archive.html
# Version requise : JDK 21+
java -version
```

### 1.3 Android Studio
```bash
# Télécharger depuis https://developer.android.com/studio
# Installation complète avec SDK :
# - Android SDK Platform-Tools
# - Android SDK Build-Tools (35.0.0+)
# - Android SDK Platform (API 36)
```

### 1.4 Android SDK (Configuration)
```bash
# Définir ANDROID_HOME en variable d'environnement Windows :
# Paramètres → Variables d'environnement système
# Nouvelle variable :
#   ANDROID_HOME = C:\Users\[VotreUtilisateur]\AppData\Local\Android\Sdk

# Vérifier :
echo %ANDROID_HOME%
```

### 1.5 Gradle Wrapper
```bash
# Déjà inclus dans le projet
# Pas de configuration supplémentaire nécessaire
```

---

## 2. CLONER/COPIER LE PROJET

### 2.1 Sur un nouvel ordinateur
```bash
# Option A : Cloner depuis Git (si vous avez un repository)
git clone [VOTRE_REPO_URL] projetSignalement
cd projetSignalement/mobile-signalement

# Option B : Copier les fichiers du projet
# Copier le dossier entier `mobile-signalement/` sur le nouvel ordi
```

### 2.2 Structure attendue
```
mobile-signalement/
├── src/                     # Code React/TypeScript
├── android/                 # Projet Capacitor Android
├── ios/                     # Projet Capacitor iOS (optionnel)
├── public/                  # Assets statiques
├── dist/                    # Build web (généré)
├── package.json             # Dépendances npm
├── vite.config.ts          # Configuration Vite
├── tsconfig.json           # Configuration TypeScript
├── .env                    # Variables d'environnement
└── capacitor.config.ts     # Configuration Capacitor
```

---

## 3. CONFIGURATION FIREBASE

### 3.1 Récupérer la configuration Firebase
1. Aller sur [console.firebase.google.com](https://console.firebase.google.com)
2. Sélectionner le projet `cloud-807c9`
3. ⚙️ **Paramètres du projet** → **Général**
4. Copier la configuration Web (clé API, ID projet, etc.)

### 3.2 Créer/Mettre à jour le fichier `.env`
```bash
# À la racine du projet mobile-signalement/
# Créer un fichier .env avec :

VITE_FIREBASE_API_KEY=AIzaSyBxTuYtxj32_aY9NlTJuhiGcFkBpI0syRI
VITE_FIREBASE_AUTH_DOMAIN=cloud-807c9.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cloud-807c9
VITE_FIREBASE_STORAGE_BUCKET=cloud-807c9.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=893011046982
VITE_FIREBASE_APP_ID=1:893011046982:web:e9511aa3f76f940d755047

# API Backend (si disponible localement)
VITE_API_URL=http://localhost:8000/api
```

### 3.3 Télécharger `google-services.json` (important pour Android)
1. **Firebase Console** → Paramètres du projet → **Vos apps** → Android
2. Si pas d'app Android créée : **Ajouter une app** → Android
   - Package name : `com.signalement.app`
   - SHA-1 : (optionnel pour notifications)
3. **Télécharger `google-services.json`**
4. **Placer le fichier** : `android/app/google-services.json`

---

## 4. INSTALLATION DES DÉPENDANCES

```bash
cd mobile-signalement

# Installer les dépendances npm
npm install

# Cette commande installe :
# - React, TypeScript, Vite
# - Firebase SDK
# - Capacitor et tous les plugins
# - Leaflet, Axios, etc.
```

**Durée estimée:** 5-10 minutes (selon la connexion)

---

## 5. BUILD WEB

```bash
# Compiler le code React/TypeScript en fichiers statiques
npm run build

# Génère le dossier `dist/` avec :
# - index.html
# - assets/*.js
# - assets/*.css
```

**Vérifier** : Le dossier `dist/` doit exister et contenir des fichiers.

---

## 6. SYNCHRONISER AVEC ANDROID

```bash
# Copier les fichiers web vers le projet Android Capacitor
npx cap sync android

# Cette commande :
# - Copie les fichiers de dist/ vers android/app/src/main/assets/public/
# - Ajoute les permissions Android
# - Met à jour les plugins Capacitor
```

---

## 7. OUVERTURE DANS ANDROID STUDIO

```bash
# Ouvrir le projet Android dans Android Studio
npx cap open android

# OU manuellement :
# - Ouvrir Android Studio
# - File → Open → Sélectionner le dossier `android/`
```

### 7.1 Premier lancement dans Android Studio
```
Build → Clean Project
Build → Rebuild Project
```

**Durée estimée:** 5-15 minutes (première compilation)

---

## 8. EXÉCUTER L'APP

### 8.1 Sur un émulateur Android
```bash
# Dans Android Studio :
# 1. Tools → Device Manager → Créer un nouvel appareil virtuel
# 2. Sélectionner l'appareil
# 3. ▶️ Run → Run 'app' (ou Shift+F10)
```

### 8.2 Sur un téléphone physique
```bash
# 1. Brancher le téléphone en USB
# 2. Activer le mode développeur (Android 7+) :
#    Paramètres → À propos du téléphone → Appuyer 7x sur "Version de compilation"
# 3. Autoriser l'USB Debugging sur le téléphone
# 4. Dans Android Studio : Run → Select Device → Votre téléphone
# 5. ▶️ Run 'app'
```

---

## 9. ACCÈS À L'APP

### 9.1 Première connexion
**URL d'accès (web uniquement)** : `http://localhost:5173` (après `npm run dev`)

### 9.2 Connexion utilisateur
- Email/Mot de passe : compte Firebase créé au préalable
- OU : Google Sign-In (si configuré)

### 9.3 Fonctionnalités
- 📍 **Carte Leaflet** : voir tous les signalements
- ➕ **Ajouter signalement** : créer un problème route/trottoir
- 📋 **Mes signalements** : voir vos signalements personnels
- 🔔 **Notifications** : être alerté des changements de statut

---

## 10. TROUBLESHOOTING

### 10.1 Erreur : "ANDROID_HOME not set"
```bash
# Windows : Ajouter la variable d'environnement
setx ANDROID_HOME "C:\Users\[VotreUtilisateur]\AppData\Local\Android\Sdk"
# Redémarrer l'invite de commande

# Vérifier :
echo %ANDROID_HOME%
```

### 10.2 Erreur : "Gradle build failed"
```bash
# Nettoyer et réessayer
cd android
gradlew clean
cd ..
npm run build
npx cap sync android
```

### 10.3 Erreur : "Duplicate androidx classes"
```bash
# Déjà corrigé dans android/build.gradle
# Si persiste : 
# Build → Clean Project
# Build → Rebuild Project (dans Android Studio)
```

### 10.4 Pas de notification affichée
```
Vérifier :
1. Permissions Android → Paramètres → Notifications
2. google-services.json présent dans android/app/
3. L'app n'est pas forcée en sleep
4. Consulter les logs : adb logcat | grep "firebase"
```

### 10.5 "Cannot find module '@capacitor/core'"
```bash
npm install @capacitor/core
npm run build
```

---

## 11. COMMANDES UTILES

```bash
# Développement local (web)
npm run dev              # Lancer le serveur Vite (http://localhost:5173)

# Build et déploiement
npm run build            # Compiler pour production
npm run build:apk        # Générer APK (si configuré)

# Capacitor
npx cap sync android     # Synchroniser avec Android
npx cap open android     # Ouvrir Android Studio
npx cap run android      # Builder et lancer sur appareil (option alternative)

# Debugging
adb devices              # Lister les appareils connectés
adb logcat               # Voir les logs Android en temps réel
```

---

## 12. FICHIERS IMPORTANTS À CONSERVER

```
mobile-signalement/
├── .env         ⚠️ IMPORTANT : Ne pas commiter, contient les clés Firebase
├── android/app/google-services.json  ⚠️ Nécessaire pour notifications
├── package-lock.json  # Pour garantir les versions exactes
└── src/         # Code source
```

---

## 13. POINTS DE CONFIGURATION ADDITIONNELS

### 13.1 Backend Laravel (optionnel, fallback)
L'app fonctionne sans backend Laravel, mais pour les données :
```bash
# Si vous avez Laravel en local :
# Démarrer le serveur Laravel
cd ../laravel-auth-docker
php artisan serve  # Écoute http://localhost:8000

# Actualiser .env :
VITE_API_URL=http://localhost:8000/api
```

### 13.2 Firestore Rules (sécurité)
Dans Firebase Console → Firestore Database → Rules
```javascript
// Assurez-vous que ces règles autorisent la lecture/écriture appropriée
match /signalements/{document=**} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update, delete: if resource.data.user_uid == request.auth.uid;
}

match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## 14. RÉSUMÉ DES ÉTAPES RAPIDES

Pour les impatients :

```bash
# 1. Prérequis installés ? ✓
# 2. Node + Android Studio + JDK ok ? ✓

# 3. Clone/Copie du projet
cd mobile-signalement

# 4. Fichier .env créé avec les clés Firebase ? ✓
# 5. google-services.json en place ? ✓

# 6. Installation
npm install

# 7. Build web  
npm run build

# 8. Sync Android
npx cap sync android

# 9. Ouvrir et exécuter
npx cap open android
# → Dans Android Studio : Run → Run 'app'

# À l'attendre... ✨
```

---

## 15. SUPPORT & RESSOURCES

- 📖 **Documentation Capacitor** : https://capacitorjs.com/docs/getting-started
- 🔥 **Firebase Console** : https://console.firebase.google.com
- 🤖 **Android Docs** : https://developer.android.com/docs
- 📱 **React Docs** : https://react.dev
- 🗺️ **Leaflet Docs** : https://leafletjs.com

---

**Version du guide** : 1.0  
**Date** : Février 2026  
**App Version** : 1.0.0
