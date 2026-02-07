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

**Windows :**
```bash
# Option 1 : Télécharger l'installateur depuis https://nodejs.org/
# Version recommandée : LTS 20.x ou plus
# Exécuter l'installateur (.msi) et suivre les instructions

# Option 2 : Avec chocolatey (si installé)
choco install nodejs

# Vérifier l'installation :
node --version  # v20.x.x ou plus
npm --version   # 10.x.x ou plus
```

### 1.2 Java Development Kit (JDK 21+)

**Windows :**
```bash
# Télécharger depuis :
# https://www.oracle.com/java/technologies/javase/jdk21-archive.html

# Ou avec Chocolatey :
choco install jdk21

# Vérifier l'installation :
java -version      # java version "21.x.x"
javac -version     # javac 21.x.x
```

**Configurer la variable JAVA_HOME :**
```bash
# Windows (Panneau de configuration) :
# Paramètres → Variables d'environnement système
# Nouvelle variable :
#   JAVA_HOME = C:\Program Files\Java\jdk-21

# Ou en PowerShell (Admin) :
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "Machine")
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"

# Vérifier :
echo %JAVA_HOME%
```

### 1.3 Android Studio

**Installation Windows :**
```bash
# 1. Télécharger depuis https://developer.android.com/studio
# 2. Exécuter l'installateur
# 3. Cocher "Android SDK" + "Android Virtual Device"
# 4. Compléter l'installation

# Après installation, ouvrir Android Studio et :
# Tools → SDK Manager → Installer :
#   - SDK Platforms → Android 15.x (API 36)
#   - SDK Tools → 
#       - Android SDK Platform-Tools (35.0.0+)
#       - Android SDK Build-Tools (35.0.0+)
#       - Google Play services
#       - Android Emulator
```

### 1.4 Android SDK - Configuration ANDROID_HOME

**Windows :**
```bash
# Android Studio installe SDK par défaut à :
# C:\Users\[VotreUtilisateur]\AppData\Local\Android\Sdk

# Définir la variable d'environnement (Admin PowerShell) :
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:USERPROFILE\AppData\Local\Android\Sdk", "Machine")
$env:ANDROID_HOME = "$env:USERPROFILE\AppData\Local\Android\Sdk"

# Vérifier :
echo %ANDROID_HOME%  # Doit retourner le chemin du SDK

# Ajouter platform-tools au PATH (Admin PowerShell) :
$androidSdk = "$env:USERPROFILE\AppData\Local\Android\Sdk"
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
if ($currentPath -notlike "*$androidSdk\platform-tools*") {
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$androidSdk\platform-tools", "Machine")
}

# Vérifier adb :
adb --version  # Doit afficher : Android Debug Bridge version
```

### 1.5 Gradle Wrapper

```bash
# Le projet inclut déjà Gradle Wrapper
# Pas de configuration supplémentaire nécessaire

# Vérifier que les fichiers existent :
# - mobile-signalement/android/gradlew (Linux/Mac)
# - mobile-signalement/android/gradlew.bat (Windows)
```

### 1.6 Git (optionnel mais recommandé)

```bash
# Télécharger depuis https://git-scm.com/download/win

# Ou avec Chocolatey :
choco install git

# Vérifier :
git --version  # git version 2.x.x
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

### 4.1 Dépendances npm (Frontend + Capacitor)

```bash
cd mobile-signalement

# Installer TOUTES les dépendances du projet
npm install

# Cette commande installe automatiquement :
# Frontend :
#   - react (19.x)
#   - react-dom (19.x)
#   - react-router-dom (6.x)
#   - typescript (5.x)
#   - vite (7.x)
#
# Firebase :
#   - firebase (10.x)
#   - @capacitor-firebase/messaging (6.x)
#
# Mobile :
#   - @capacitor/core (6.x)
#   - @capacitor/android (6.x)
#   - @capacitor/app (6.x)
#   - @capacitor/geolocation (6.x)
#   - @capacitor/local-notifications (6.x)
#
# Cartes :
#   - leaflet (1.9.x)
#   - axios (1.x)
#
# Autres :
#   - date-fns (3.x)
#   - lucide-react (0.x)
```

**Durée estimée:** 5-10 minutes

**Vérifier l'installation :**
```bash
# Vérifier que package-lock.json est créé
ls package-lock.json  # Doit exister

# Vérifier que node_modules est créé
ls node_modules  # Doit contenir ~1000 dossiers

# Vérifier les versions critiques
npm list react
npm list typescript
npm list @capacitor/core
```

### 4.2 Dépendances Android (Gradle)

```bash
# Gradle Wrapper télécharger automatiquement via :
cd android
./gradlew.bat --version  # Sur Windows

# Cela télécharge Gradle (~200 MB) et affiche la version
# Vous verrez quelque chose comme :
# Gradle 8.7.0

# C'est OK si ça prend plusieurs minutes la première fois
```

### 4.3 Installation optionnelle : Commandes globales utiles

```bash
# Installer Capacitor CLI globalement (optionnel)
npm install -g @capacitor/cli

# Vérifier :
cap --version  # Doit afficher la version Capacitor

# Installer Android SDK Command-line Tools (optionnel)
# Permet d'utiliser sdkmanager en ligne de commande
sdkmanager --version
```

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

### 10.2 Erreur : "JAVA_HOME not set"
```bash
# Windows (PowerShell Admin) :
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Java\jdk-21", "Machine")

# Vérifier :
echo %JAVA_HOME%
java -version
```

### 10.3 Erreur : "npm command not found"
```bash
# Node.js n'est pas installé ou le PATH n'est pas à jour
# Solution :
# 1. Télécharger https://nodejs.org/ (LTS 20+)
# 2. Exécuter l'installateur complètement
# 3. Redémarrer le terminal ET l'ordinateur
# 4. Vérifier :
node --version
npm --version
```

### 10.4 Erreur : "gradlew.bat not found"
```bash
# Le dossier android/ n'est pas correctement créé
# Solution :
cd mobile-signalement
npx cap sync android
# Cela recréera le dossier android avec gradlew.bat
```

### 10.5 Erreur : "Gradle build failed"
```bash
# Nettoyer et réessayer
cd mobile-signalement
cd android
./gradlew.bat clean
cd ..
npm run build
npx cap sync android
```

### 10.6 Erreur : "Duplicate androidx classes"
```bash
# Déjà corrigé dans android/build.gradle
# Si persiste : 
# Dans Android Studio :
# Build → Clean Project
# Build → Rebuild Project
```

### 10.7 Pas de notification affichée
```
Vérifier :
1. google-services.json présent dans android/app/
2. Permissions Android → Paramètres → Notifications
3. Consulter les logs : adb logcat | grep "firebase"
4. L'app n'est pas forcée en sleep
```

### 10.8 Erreur : "Cannot find module '@capacitor/core'"
```bash
npm install @capacitor/core
npm run build
npx cap sync android
```

### 10.9 Écran noir au lancement de l'APK
```bash
# Causes possibles :
# 1. google-services.json manquant → télécharger depuis Firebase Console
# 2. Les fichiers web ne sont pas compilés → npm run build
# 3. Build Android incomplet → Android Studio: Build → Rebuild Project

# Solutions :
npm run build        # Recompiler le web
npx cap sync android # Resync avec Android
# Puis dans Android Studio : Build → Rebuild Project → Run
```

### 10.10 Erreur : "ADB devices not found"
```bash
# Le téléphone n'est pas en mode debug USB
# Solutions :
# 1. Sur le téléphone : Paramètres → À propos du téléphone
# 2. Appuyer 7 fois sur "Version de compilation"
# 3. Retour : Paramètres → Options pour développeurs
# 4. Activer "Débogage USB"
# 5. Brancher en USB et confirmer "Autoriser le débogage"

# Vérifier :
adb devices  # Doit lister votre téléphone
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
# ===== VÉRIFIER LES PRÉREQUIS =====
# Ouvrir PowerShell (Admin) et exécuter :
node --version       # Doit être v20.x.x ou plus
npm --version        # Doit être 10.x.x ou plus
java -version        # Doit être 21.x.x ou plus
echo %ANDROID_HOME%  # Doit afficher le chemin du SDK
adb --version        # Doit afficher "Android Debug Bridge"

# Si une des commandes échoue → revoir la section 1 (PRÉREQUIS)

# ===== CONFIGURATION =====
cd mobile-signalement

# Créer ou vérifier le fichier .env avec les clés Firebase
# (voir section 3.2 du guide)

# Télécharger google-services.json depuis Firebase Console
# et le placer dans android/app/google-services.json

# ===== INSTALLATION DES DÉPENDANCES =====
npm install          # Installe les dépendances npm (~5-10 min)
npm list react       # Vérifier que react est installé

# ===== BUILD ET SYNCHRONISATION =====
npm run build        # Compile le code React
npx cap sync android # Synchronise avec Android

# ===== EXÉCUTION =====
npx cap open android # Ouvre Android Studio
# → Dans Android Studio : Build → Rebuild Project
# → Run → Run 'app'

# À l'attendre... ✨ (la première exécution peut prendre 10-15 min)
```

**Checklist avant de démarrer :**
- [ ] Node.js 20+ installé
- [ ] JDK 21+ installé
- [ ] Android Studio installé avec SDK
- [ ] ANDROID_HOME défini
- [ ] JAVA_HOME défini
- [ ] .env créé avec clés Firebase
- [ ] google-services.json téléchargé

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
