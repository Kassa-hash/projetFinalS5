# 🔒 Fonctionnalité de Blocage et Déblocage de Compte

## 📚 Table des matières

1. [Introduction](#introduction)
2. [Architecture du système](#architecture)
3. [Structure de la base de données](#structure-bdd)
4. [Logique de blocage automatique](#logique-blocage)
5. [API de déblocage](#api-deblocage)
6. [Méthodes du modèle User](#methodes-user)
7. [Flux complet](#flux-complet)
8. [Configuration](#configuration)
9. [Exemples d'utilisation](#exemples)
10. [Sécurité et bonnes pratiques](#securite)

---

## 🎯 Introduction

### Qu'est-ce que le blocage de compte ?

Le **blocage de compte** est une mesure de sécurité qui empêche temporairement un utilisateur de se connecter après plusieurs tentatives de connexion échouées. C'est une protection contre les **attaques par force brute** (brute-force attacks).

### Objectifs

✅ **Sécurité** : Bloquer les attaques automatisées  
✅ **Protection** : Limiter les tentatives de devinette de mot de passe  
✅ **Traçabilité** : Savoir combien de tentatives ont échoué  
✅ **Réversibilité** : Débloquer manuellement ou automatiquement  

### Types de blocage

Notre système implémente **deux mécanismes** :

1. **`account_lockout`** (boolean) : Blocage permanent manuel
   - Nécessite intervention d'un administrateur
   - Utilisé pour suspendre un compte suspect
   
2. **`locked_until`** (timestamp) : Blocage temporaire automatique
   - Automatique après X tentatives échouées
   - Se débloque automatiquement après expiration
   - Peut être débloqué manuellement

---

## 🏗️ Architecture du système

### Composants

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Vue.js)                     │
│                                                           │
│  • Formulaire de login                                   │
│  • Message d'erreur "Compte verrouillé"                  │
│  • (Futur) Interface admin pour débloquer                │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ POST /api/login
                        │ POST /api/unlock-account
                        │ GET /api/account-status/{email}
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Laravel)                       │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │     FirebaseAuthController (login)                 │ │
│  │                                                     │ │
│  │  1. Vérifier si compte bloqué (account_lockout)   │ │
│  │  2. Vérifier si locked_until > now                │ │
│  │  3. Si bloqué → Retourner erreur 422              │ │
│  │  4. Si OK → Tenter authentification               │ │
│  │  5. Si échec → Incrémenter login_attempts         │ │
│  │  6. Si login_attempts >= 3 → Bloquer (locked_until)│ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │     UnlockAccountController                        │ │
│  │                                                     │ │
│  │  • unlock(): Débloquer un compte                  │ │
│  │  • status(): Vérifier statut d'un compte          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │     User Model                                     │ │
│  │                                                     │ │
│  │  • isLocked(): Vérifier si compte bloqué          │ │
│  │  • incrementLoginAttempts(): +1 tentative         │ │
│  │  • resetLoginAttempts(): Débloquer                │ │
│  └────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              BASE DE DONNÉES (PostgreSQL)                │
│                                                           │
│  Table: users                                            │
│  ├─ account_lockout (boolean)                           │
│  ├─ login_attempts (integer)                            │
│  └─ locked_until (timestamp nullable)                   │
└─────────────────────────────────────────────────────────┘
```

---

## 💾 Structure de la base de données

### Table `users`

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    
    -- Champs de blocage
    account_lockout BOOLEAN DEFAULT FALSE,    -- Blocage manuel permanent
    login_attempts INTEGER DEFAULT 0,          -- Compteur de tentatives
    locked_until TIMESTAMP NULL,               -- Blocage temporaire jusqu'à cette date
    
    -- Autres champs
    firebase_uid VARCHAR(255) UNIQUE NULLABLE,
    phone VARCHAR(20) NULLABLE,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Détails des colonnes de blocage

| Colonne            | Type      | Description                                           | Exemple                    |
|--------------------|-----------|-------------------------------------------------------|----------------------------|
| `account_lockout`  | Boolean   | Blocage manuel par admin (permanent)                  | `true` = compte suspendu   |
| `login_attempts`   | Integer   | Nombre de tentatives échouées consécutives            | `0`, `1`, `2`, `3`         |
| `locked_until`     | Timestamp | Date/heure de fin du blocage temporaire               | `2026-01-20 15:45:00`      |

### États possibles d'un compte

| État                           | account_lockout | login_attempts | locked_until       | Peut se connecter ? |
|--------------------------------|-----------------|----------------|--------------------|---------------------|
| **Normal (actif)**             | false           | 0-2            | null               | ✅ Oui              |
| **Bloqué temporairement**      | false           | ≥3             | 2026-01-20 15:45   | ❌ Non              |
| **Bloqué temporaire expiré**   | false           | ≥3             | 2026-01-20 15:30 (passé) | ✅ Oui       |
| **Bloqué manuellement**        | true            | *              | *                  | ❌ Non              |

---

## 🔐 Logique de blocage automatique

### Flux de connexion avec compteur

```
Utilisateur essaie de se connecter
         │
         ▼
  ┌──────────────────┐
  │ Vérifier blocage │
  └──────┬───────────┘
         │
         ├─► account_lockout = true ? ─► BLOQUER ❌
         │
         ├─► locked_until > now ? ─► BLOQUER ❌
         │
         ▼
  ┌──────────────────────┐
  │ Tenter authentification│
  └──────┬────────────────┘
         │
    ┌────┴────┐
    │ Succès? │
    └────┬────┘
         │
    OUI  │  NON
    ┌────▼────┐
    │         │
    ▼         ▼
┌──────┐  ┌─────────────────────────┐
│CONNEXION│  │ login_attempts++         │
│ OK ✅   │  └─────────┬───────────────┘
└──────┘           │
               ┌───▼────┐
               │ >= 3 ? │
               └───┬────┘
                   │
              OUI  │  NON
              ┌────▼────┐
              │         │
              ▼         ▼
      ┌──────────┐  ┌──────────┐
      │ BLOQUER   │  │ Erreur   │
      │ 15 min    │  │ simple   │
      └──────────┘  └──────────┘
```

### Code dans FirebaseAuthController

**Étape 1 : Vérification avant authentification**

```php
// Dans la méthode login()
$user = User::where('email', $credentials['email'])->first();

if ($user !== null && Hash::check($credentials['password'], $user->password)) {
    // Vérifier le blocage manuel
    if ($user->account_lockout) {
        throw ValidationException::withMessages([
            'email' => ['Ce compte est verrouillé.'],
        ]);
    }
    
    // Vérifier le blocage temporaire
    if ($user->isLocked()) {
        throw ValidationException::withMessages([
            'email' => ['Compte temporairement bloqué. Réessayez plus tard.'],
        ]);
    }
    
    // Authentification réussie → Réinitialiser les tentatives
    $user->resetLoginAttempts();
    
    return response()->json([...]);
}
```

**Étape 2 : Gestion des échecs** (à implémenter)

```php
// Si l'authentification échoue
$user = User::where('email', $credentials['email'])->first();

if ($user) {
    // Incrémenter le compteur
    $user->incrementLoginAttempts();
    
    // Vérifier si maintenant bloqué
    if ($user->isLocked()) {
        throw ValidationException::withMessages([
            'email' => ['Trop de tentatives. Compte bloqué pendant 15 minutes.'],
        ]);
    }
}

throw ValidationException::withMessages([
    'email' => ['Email ou mot de passe incorrect.'],
]);
```

---

## 🛠️ API de déblocage

### Routes disponibles

```php
// routes/api.php

// Débloquer un compte
POST /api/unlock-account

// Vérifier le statut d'un compte
GET /api/account-status/{email}
```

### 1. Débloquer un compte

**Endpoint** : `POST /api/unlock-account`

**Requête**
```http
POST http://localhost:8000/api/unlock-account
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Réponse succès (200)**
```json
{
  "success": true,
  "message": "Compte débloqué avec succès",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "login_attempts": 0,
    "locked_until": null
  }
}
```

**Réponse erreur - Email invalide (422)**
```json
{
  "success": false,
  "message": "Le champ email est obligatoire.",
  "errors": {
    "email": [
      "Le champ email est obligatoire."
    ]
  }
}
```

**Réponse erreur - Utilisateur non trouvé (404)**
```json
{
  "success": false,
  "message": "Utilisateur non trouvé"
}
```

### 2. Vérifier le statut d'un compte

**Endpoint** : `GET /api/account-status/{email}`

**Requête**
```http
GET http://localhost:8000/api/account-status/john@example.com
```

**Réponse (200)**
```json
{
  "success": true,
  "is_locked": true,
  "login_attempts": 3,
  "locked_until": "2026-01-20 15:45:00",
  "max_attempts": 3
}
```

**Interprétation**
- `is_locked: true` → Le compte est actuellement bloqué
- `login_attempts: 3` → 3 tentatives échouées
- `locked_until: "2026-01-20 15:45:00"` → Bloqué jusqu'à cette date/heure
- `max_attempts: 3` → Configuration du nombre max de tentatives

---

## 📝 Méthodes du modèle User

### Fichier : `app/Models/User.php`

### 1. `isLocked()` - Vérifier si compte bloqué

**Code**
```php
public function isLocked(): bool
{
    return $this->locked_until && $this->locked_until->isFuture();
}
```

**Explication**
- Vérifie si `locked_until` existe (n'est pas null)
- Vérifie si `locked_until` est dans le futur (pas encore expiré)
- Retourne `true` si les deux conditions sont vraies

**Utilisation**
```php
$user = User::find(1);

if ($user->isLocked()) {
    echo "Compte bloqué jusqu'à " . $user->locked_until;
} else {
    echo "Compte actif";
}
```

**Exemples**

| locked_until           | Date actuelle         | isLocked() | Raison                        |
|------------------------|-----------------------|------------|-------------------------------|
| `null`                 | *                     | `false`    | Pas de blocage                |
| `2026-01-20 15:45:00`  | `2026-01-20 15:30:00` | `true`     | locked_until dans le futur    |
| `2026-01-20 15:45:00`  | `2026-01-20 16:00:00` | `false`    | locked_until dans le passé    |

### 2. `incrementLoginAttempts()` - Incrémenter les tentatives

**Code**
```php
public function incrementLoginAttempts(): void
{
    $maxAttempts = config('auth.max_login_attempts', 3);
    
    $this->increment('login_attempts');
    
    if ($this->login_attempts >= $maxAttempts) {
        $this->locked_until = now()->addMinutes(config('auth.lockout_duration', 15));
        $this->save();
    }
}
```

**Explication étape par étape**

1. **Récupérer la configuration**
   ```php
   $maxAttempts = config('auth.max_login_attempts', 3);
   ```
   - Lit la valeur dans `config/auth.php`
   - Valeur par défaut : `3` tentatives

2. **Incrémenter le compteur**
   ```php
   $this->increment('login_attempts');
   ```
   - Équivaut à : `UPDATE users SET login_attempts = login_attempts + 1`
   - Opération atomique (safe en concurrent)

3. **Vérifier si limite atteinte**
   ```php
   if ($this->login_attempts >= $maxAttempts) {
       $this->locked_until = now()->addMinutes(15);
       $this->save();
   }
   ```
   - Si tentatives ≥ 3 → Bloquer
   - `now()->addMinutes(15)` : Bloquer pendant 15 minutes
   - Sauvegarder dans la base de données

**Exemple d'évolution**

```php
// Tentative 1 (échouée)
$user->incrementLoginAttempts();
// login_attempts = 1, locked_until = null

// Tentative 2 (échouée)
$user->incrementLoginAttempts();
// login_attempts = 2, locked_until = null

// Tentative 3 (échouée)
$user->incrementLoginAttempts();
// login_attempts = 3, locked_until = "2026-01-20 15:45:00"
// 🔒 COMPTE BLOQUÉ !
```

### 3. `resetLoginAttempts()` - Réinitialiser et débloquer

**Code**
```php
public function resetLoginAttempts(): void
{
    $this->update([
        'login_attempts' => 0,
        'locked_until' => null,
    ]);
}
```

**Explication**
- Met `login_attempts` à `0`
- Met `locked_until` à `null`
- Sauvegarde en une seule requête SQL

**Quand l'appeler ?**
1. ✅ Après une connexion réussie
2. ✅ Déblocage manuel via API
3. ✅ Déblocage administrateur

**Utilisation**
```php
// Cas 1 : Connexion réussie
if (Hash::check($password, $user->password)) {
    $user->resetLoginAttempts();
    // Authentifier l'utilisateur
}

// Cas 2 : Déblocage admin
public function unlock(Request $request) {
    $user = User::where('email', $request->email)->first();
    $user->resetLoginAttempts();
    return response()->json(['message' => 'Compte débloqué']);
}
```

---

## 🔄 Flux complet

### Scénario 1 : Blocage automatique

```
┌─────────────────────────────────────────────────────────┐
│ Utilisateur: john@example.com                           │
│ Mot de passe réel: "CorrectPassword123"                 │
└─────────────────────────────────────────────────────────┘

TENTATIVE 1 (ÉCHEC)
─────────────────────
POST /api/login
{
  "email": "john@example.com",
  "password": "WrongPassword1"
}

Backend:
├─ Vérifier account_lockout = false ✓
├─ Vérifier locked_until = null ✓
├─ Tenter auth Firebase → ÉCHEC
├─ Tenter auth PostgreSQL → ÉCHEC (password incorrect)
├─ incrementLoginAttempts()
│  ├─ login_attempts = 1
│  └─ 1 < 3 → Pas de blocage
└─ Retourner erreur 422

Réponse:
{
  "message": "Email ou mot de passe incorrect."
}

État BDD:
- login_attempts: 1
- locked_until: null
─────────────────────────────────────────────────

TENTATIVE 2 (ÉCHEC)
─────────────────────
POST /api/login
{
  "email": "john@example.com",
  "password": "WrongPassword2"
}

Backend:
├─ incrementLoginAttempts()
│  ├─ login_attempts = 2
│  └─ 2 < 3 → Pas de blocage
└─ Retourner erreur 422

État BDD:
- login_attempts: 2
- locked_until: null
─────────────────────────────────────────────────

TENTATIVE 3 (ÉCHEC)
─────────────────────
POST /api/login
{
  "email": "john@example.com",
  "password": "WrongPassword3"
}

Backend:
├─ incrementLoginAttempts()
│  ├─ login_attempts = 3
│  ├─ 3 >= 3 → BLOQUER !
│  ├─ locked_until = now() + 15 minutes
│  │  = 2026-01-20 15:45:00
│  └─ save()
└─ Retourner erreur 422

Réponse:
{
  "message": "Trop de tentatives. Compte bloqué pendant 15 minutes."
}

État BDD:
- login_attempts: 3
- locked_until: 2026-01-20 15:45:00
🔒 COMPTE BLOQUÉ !
─────────────────────────────────────────────────

TENTATIVE 4 (BLOQUÉ)
────────────────────
POST /api/login
{
  "email": "john@example.com",
  "password": "CorrectPassword123"  ← Même le bon mot de passe !
}

Backend:
├─ Chercher user
├─ isLocked() = true (locked_until dans le futur)
└─ Retourner erreur 422 IMMÉDIATEMENT

Réponse:
{
  "message": "Compte temporairement bloqué. Réessayez plus tard."
}

État BDD: (inchangé)
- login_attempts: 3
- locked_until: 2026-01-20 15:45:00
─────────────────────────────────────────────────

15 MINUTES PLUS TARD...
───────────────────────

TENTATIVE 5 (SUCCÈS)
────────────────────
Heure actuelle: 2026-01-20 15:46:00

POST /api/login
{
  "email": "john@example.com",
  "password": "CorrectPassword123"
}

Backend:
├─ Chercher user
├─ isLocked() = false (locked_until dans le passé)
├─ Tenter auth → SUCCÈS ✅
├─ resetLoginAttempts()
│  ├─ login_attempts = 0
│  └─ locked_until = null
└─ Retourner tokens + user

État BDD:
- login_attempts: 0
- locked_until: null
✅ COMPTE DÉBLOQUÉ AUTOMATIQUEMENT
```

### Scénario 2 : Déblocage manuel

```
État initial:
- login_attempts: 3
- locked_until: 2026-01-20 15:45:00
- Heure actuelle: 2026-01-20 15:35:00 (encore bloqué)

ADMIN DÉBLOQUE LE COMPTE
─────────────────────────
POST /api/unlock-account
{
  "email": "john@example.com"
}

Backend (UnlockAccountController):
├─ Valider email
├─ Chercher user
├─ user->resetLoginAttempts()
│  ├─ login_attempts = 0
│  └─ locked_until = null
└─ Retourner succès

Réponse:
{
  "success": true,
  "message": "Compte débloqué avec succès",
  "user": {
    "login_attempts": 0,
    "locked_until": null
  }
}

État BDD:
- login_attempts: 0
- locked_until: null
✅ DÉBLOCAGE MANUEL RÉUSSI

L'utilisateur peut maintenant se connecter immédiatement !
```

---

## ⚙️ Configuration

### Fichier : `config/auth.php`

**À ajouter** (actuellement pas dans le fichier) :

```php
<?php

return [
    // ... autres configurations ...
    
    /*
    |--------------------------------------------------------------------------
    | Login Attempts Configuration
    |--------------------------------------------------------------------------
    |
    | Configure le nombre de tentatives de connexion avant blocage
    | et la durée du blocage temporaire.
    |
    */
    
    'max_login_attempts' => env('AUTH_MAX_LOGIN_ATTEMPTS', 3),
    
    'lockout_duration' => env('AUTH_LOCKOUT_DURATION', 15), // minutes
];
```

### Variables d'environnement `.env`

```env
# Nombre de tentatives avant blocage (défaut: 3)
AUTH_MAX_LOGIN_ATTEMPTS=3

# Durée du blocage en minutes (défaut: 15)
AUTH_LOCKOUT_DURATION=15
```

### Personnalisation

**Exemple 1 : Plus strict (sécurité maximale)**
```env
AUTH_MAX_LOGIN_ATTEMPTS=2
AUTH_LOCKOUT_DURATION=30
```
- Blocage après 2 tentatives
- Durée : 30 minutes

**Exemple 2 : Plus permissif (meilleure UX)**
```env
AUTH_MAX_LOGIN_ATTEMPTS=5
AUTH_LOCKOUT_DURATION=5
```
- Blocage après 5 tentatives
- Durée : 5 minutes

---

## 💡 Exemples d'utilisation

### Frontend Vue.js

**1. Gestion de l'erreur de blocage**

```vue
<!-- LoginForm.vue -->
<script setup>
import { ref } from 'vue'
import axios from 'axios'

const email = ref('')
const password = ref('')
const error = ref('')
const isLocked = ref(false)

const handleLogin = async () => {
  try {
    const response = await axios.post('/api/login', {
      email: email.value,
      password: password.value
    })
    
    // Connexion réussie
    console.log('Logged in!', response.data)
    
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message
      
      // Détecter si c'est un blocage
      if (error.value.includes('bloqué') || error.value.includes('verrouillé')) {
        isLocked.value = true
      }
    }
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <input v-model="email" type="email" />
    <input v-model="password" type="password" />
    
    <button type="submit" :disabled="isLocked">
      Se connecter
    </button>
    
    <div v-if="error" class="error">
      {{ error }}
      
      <div v-if="isLocked" class="lock-notice">
        🔒 Votre compte est temporairement bloqué.
        Contactez un administrateur ou réessayez plus tard.
      </div>
    </div>
  </form>
</template>
```

**2. Interface admin de déblocage**

```vue
<!-- AdminUnlockAccount.vue -->
<script setup>
import { ref } from 'vue'
import axios from 'axios'

const email = ref('')
const message = ref('')
const accountStatus = ref(null)

const checkStatus = async () => {
  try {
    const response = await axios.get(`/api/account-status/${email.value}`)
    accountStatus.value = response.data
  } catch (err) {
    message.value = 'Erreur lors de la vérification'
  }
}

const unlockAccount = async () => {
  try {
    const response = await axios.post('/api/unlock-account', {
      email: email.value
    })
    
    message.value = response.data.message
    accountStatus.value = null
    
  } catch (err) {
    message.value = err.response?.data?.message || 'Erreur'
  }
}
</script>

<template>
  <div class="admin-panel">
    <h2>Déblocage de compte</h2>
    
    <input v-model="email" type="email" placeholder="Email utilisateur" />
    
    <button @click="checkStatus">Vérifier statut</button>
    
    <div v-if="accountStatus" class="status-box">
      <h3>Statut du compte</h3>
      <p>Bloqué: {{ accountStatus.is_locked ? 'Oui' : 'Non' }}</p>
      <p>Tentatives: {{ accountStatus.login_attempts }} / {{ accountStatus.max_attempts }}</p>
      <p v-if="accountStatus.locked_until">
        Bloqué jusqu'à: {{ accountStatus.locked_until }}
      </p>
      
      <button 
        v-if="accountStatus.is_locked" 
        @click="unlockAccount"
        class="btn-unlock"
      >
        🔓 Débloquer le compte
      </button>
    </div>
    
    <div v-if="message" class="message">
      {{ message }}
    </div>
  </div>
</template>
```

### Backend - Tests avec Tinker

```php
// Lancer tinker
php artisan tinker

// Test 1: Vérifier si un compte est bloqué
$user = User::where('email', 'john@example.com')->first();
$user->isLocked(); // true ou false

// Test 2: Simuler 3 tentatives échouées
$user->incrementLoginAttempts(); // Tentative 1
$user->incrementLoginAttempts(); // Tentative 2
$user->incrementLoginAttempts(); // Tentative 3 → BLOQUE !
$user->refresh();
echo $user->locked_until; // Date/heure de déblocage

// Test 3: Débloquer manuellement
$user->resetLoginAttempts();
$user->refresh();
echo $user->login_attempts; // 0
echo $user->locked_until; // null

// Test 4: Bloquer manuellement un compte
$user->update(['account_lockout' => true]);

// Test 5: Vérifier tous les comptes bloqués
User::where('account_lockout', true)
    ->orWhere('locked_until', '>', now())
    ->get()
    ->map(fn($u) => [
        'email' => $u->email,
        'locked_until' => $u->locked_until,
        'lockout' => $u->account_lockout
    ]);
```

---

## 🛡️ Sécurité et bonnes pratiques

### 1. Ne jamais révéler l'état du compte

❌ **MAUVAIS** : Message trop précis
```json
{
  "message": "Compte bloqué. Encore 2 tentatives possibles."
}
```

✅ **BON** : Message générique
```json
{
  "message": "Email ou mot de passe incorrect."
}
```

**Pourquoi ?**
- Évite de confirmer l'existence d'un email
- Empêche l'attaquant de savoir combien de tentatives restent

### 2. Logger les tentatives suspectes

```php
use Illuminate\Support\Facades\Log;

public function incrementLoginAttempts(): void
{
    $this->increment('login_attempts');
    
    if ($this->login_attempts >= config('auth.max_login_attempts', 3)) {
        // Logger l'événement de blocage
        Log::warning('Account locked due to failed login attempts', [
            'user_id' => $this->id,
            'email' => $this->email,
            'login_attempts' => $this->login_attempts,
            'locked_until' => now()->addMinutes(15),
            'ip_address' => request()->ip()
        ]);
        
        $this->locked_until = now()->addMinutes(config('auth.lockout_duration', 15));
        $this->save();
    }
}
```

### 3. Notification email lors du blocage

```php
use App\Mail\AccountLockedMail;
use Illuminate\Support\Facades\Mail;

if ($this->login_attempts >= $maxAttempts) {
    $this->locked_until = now()->addMinutes(15);
    $this->save();
    
    // Envoyer email à l'utilisateur
    Mail::to($this->email)->send(new AccountLockedMail($this));
}
```

### 4. Déblocage sécurisé

**Protection de l'endpoint de déblocage**

```php
// routes/api.php
Route::middleware(['auth:sanctum', 'role:manager'])->group(function () {
    Route::post('/unlock-account', [UnlockAccountController::class, 'unlock']);
});
```

**Avec middleware de rôle** :
```php
// app/Http/Middleware/CheckRole.php
public function handle($request, Closure $next, $role)
{
    if (!$request->user() || $request->user()->role !== $role) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }
    return $next($request);
}
```

### 5. Rate limiting sur déblocage

```php
// routes/api.php
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/unlock-account', [UnlockAccountController::class, 'unlock']);
});
```

Limite à 5 requêtes par minute pour éviter l'abus.

### 6. Déblocage automatique progressif

**Augmenter la durée de blocage à chaque fois**

```php
public function incrementLoginAttempts(): void
{
    $this->increment('login_attempts');
    
    if ($this->login_attempts >= 3) {
        // Calcul progressif: 15min, 30min, 1h, 2h...
        $lockoutMinutes = min(
            15 * pow(2, $this->login_attempts - 3), // Exponentiel
            1440 // Max 24h
        );
        
        $this->locked_until = now()->addMinutes($lockoutMinutes);
        $this->save();
    }
}
```

**Exemple de progression** :
- 3 tentatives → 15 minutes
- 4 tentatives → 30 minutes
- 5 tentatives → 1 heure
- 6 tentatives → 2 heures
- 7+ tentatives → 24 heures (max)

---

## 📊 Monitoring et statistiques

### Requêtes SQL utiles

**1. Comptes actuellement bloqués**
```sql
SELECT email, login_attempts, locked_until
FROM users
WHERE locked_until > NOW()
ORDER BY locked_until DESC;
```

**2. Comptes avec tentatives récentes**
```sql
SELECT email, login_attempts, updated_at
FROM users
WHERE login_attempts > 0
ORDER BY login_attempts DESC;
```

**3. Comptes bloqués manuellement**
```sql
SELECT email, account_lockout, created_at
FROM users
WHERE account_lockout = TRUE;
```

### Dashboard admin (suggestions)

**Métriques à afficher** :
- 📊 Nombre de comptes bloqués (temporaire + manuel)
- 📈 Tentatives échouées dans les dernières 24h
- 🔥 Top 10 des emails avec le plus de tentatives
- ⏰ Historique des blocages par heure

---

## 🎓 Résumé

### Mécanismes de blocage

| Type                  | Champ           | Durée         | Déclenchement          | Déblocage              |
|-----------------------|-----------------|---------------|------------------------|------------------------|
| **Temporaire auto**   | `locked_until`  | 15 minutes    | 3 tentatives échouées  | Automatique ou manuel  |
| **Permanent manuel**  | `account_lockout` | Indéterminé | Action admin           | Manuel uniquement      |

### Flux résumé

```
Login → Échec → +1 tentative → ≥3 ? → Bloquer 15min → Déblocage auto/manuel
```

### Points clés

1. ✅ **Sécurité** : Protection contre brute-force
2. ✅ **UX** : Déblocage automatique après expiration
3. ✅ **Flexibilité** : Configuration via .env
4. ✅ **Traçabilité** : Logs et monitoring
5. ✅ **Contrôle** : API de déblocage manuel pour admins

---

**Version** : 1.0  
**Date** : 20 janvier 2026  
**Auteur** : Documentation pour projet S5 Cloud Final
