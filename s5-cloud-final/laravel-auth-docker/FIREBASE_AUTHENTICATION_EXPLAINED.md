# 🔥 Firebase Authentication - Guide Complet

## 📚 Table des matières

1. [Introduction à Firebase Authentication](#introduction)
2. [Architecture Firebase](#architecture)
3. [Comment fonctionne Firebase Auth](#fonctionnement)
4. [SDK PHP Firebase](#sdk-php)
5. [Méthodes utilisées dans le code](#méthodes-code)
6. [Tokens JWT Firebase](#tokens-jwt)
7. [Flux complet d'authentification](#flux-complet)
8. [Configuration Firebase](#configuration)
9. [Avantages et inconvénients](#avantages)
10. [Comparaison avec auth traditionnelle](#comparaison)

---

## 🎯 Introduction à Firebase Authentication

### Qu'est-ce que Firebase ?

**Firebase** est une plateforme de développement d'applications créée par Google. Elle fournit des services backend cloud comme :
- **Authentication** : Gestion des utilisateurs et connexions
- **Firestore** : Base de données NoSQL
- **Storage** : Stockage de fichiers
- **Cloud Functions** : Fonctions serverless
- **Hosting** : Hébergement web

### Firebase Authentication

Firebase Authentication est un service qui gère :
- ✅ Création de comptes utilisateurs
- ✅ Connexion avec email/password
- ✅ Connexion sociale (Google, Facebook, Twitter, etc.)
- ✅ Authentification par téléphone (SMS)
- ✅ Authentification anonyme
- ✅ Gestion des tokens JWT
- ✅ Réinitialisation de mot de passe
- ✅ Vérification d'email

**Dans notre projet** : Nous utilisons uniquement **Email/Password Authentication**.

---

## 🏗️ Architecture Firebase

### Composants de Firebase Auth

```
┌─────────────────────────────────────────────────────────┐
│                  FIREBASE CLOUD (Google)                 │
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Firebase Authentication Service         │  │
│  │                                                    │  │
│  │  • Stockage des utilisateurs                     │  │
│  │  • Vérification des credentials                  │  │
│  │  • Génération de tokens JWT                      │  │
│  │  • Gestion des refresh tokens                    │  │
│  │  • Révocation de tokens                          │  │
│  └──────────────────────────────────────────────────┘  │
│                          ▲                                │
└──────────────────────────┼────────────────────────────────┘
                           │
                           │ API REST / SDK
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND LARAVEL (Serveur)                   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │      SDK Firebase PHP (kreait/firebase-php)       │  │
│  │                                                    │  │
│  │  • Connexion à Firebase via credentials          │  │
│  │  • Appel des méthodes Firebase Auth              │  │
│  │  • Réception des réponses                        │  │
│  └──────────────────────────────────────────────────┘  │
│                          ▲                                │
│                          │                                │
│  ┌──────────────────────┴────────────────────────────┐  │
│  │       FirebaseAuthController.php                  │  │
│  │                                                    │  │
│  │  • login()    : Authentification                  │  │
│  │  • register() : Création de compte                │  │
│  │  • logout()   : Déconnexion                       │  │
│  └──────────────────────────────────────────────────┘  │
│                          ▲                                │
└──────────────────────────┼────────────────────────────────┘
                           │
                           │ HTTP API
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               FRONTEND VUE.JS (Client)                   │
│                                                           │
│  • Formulaires login/register                            │
│  • Envoi credentials (email, password)                   │
│  • Réception et stockage des tokens                      │
│  • Utilisation des tokens pour API calls                 │
└─────────────────────────────────────────────────────────┘
```

### Où sont stockées les données ?

| Donnée                | Stockage Firebase Cloud | Stockage PostgreSQL Local |
|-----------------------|-------------------------|---------------------------|
| Email                 | ✅ Oui                  | ✅ Oui (sync)             |
| Password (hash)       | ✅ Oui (bcrypt)         | ✅ Oui (bcrypt)           |
| Firebase UID          | ✅ Oui (auto)           | ✅ Oui (copié)            |
| Name                  | ❌ Non                  | ✅ Oui                    |
| Phone                 | ❌ Non                  | ✅ Oui                    |
| Role                  | ❌ Non                  | ✅ Oui                    |
| Account Lockout       | ❌ Non                  | ✅ Oui                    |
| Tokens JWT            | ✅ Oui (éphémère)       | ❌ Non                    |

**Important** : Firebase stocke uniquement email et password. Les autres champs (name, phone, role) sont stockés dans PostgreSQL.

---

## ⚙️ Comment fonctionne Firebase Auth

### 1. Création d'un utilisateur (Register)

#### Étape par étape

**1. Frontend envoie les données**
```javascript
// Vue.js
await axios.post('/api/register', {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123',
  password_confirmation: 'SecurePass123',
  role: 'user'
})
```

**2. Laravel valide les données**
```php
$data = $request->validate([
    'email' => ['required', 'email', 'unique:users'],
    'password' => ['required', 'string', 'min:8', 'confirmed'],
    // ...
]);
```

**3. Laravel appelle Firebase via SDK**
```php
$firebaseUser = $this->firebaseAuth->createUserWithEmailAndPassword(
    $data['email'], 
    $data['password']
);
```

**4. Firebase crée l'utilisateur dans son cloud**
```
Firebase Cloud fait :
├─ Vérifie que l'email n'existe pas déjà
├─ Hash le mot de passe avec bcrypt
├─ Génère un UID unique (ex: "Kl3mR8xP2nZ...")
├─ Stocke l'utilisateur dans Firebase Authentication
└─ Retourne l'objet UserRecord
```

**5. Objet UserRecord retourné**
```php
stdClass Object {
    uid: "Kl3mR8xP2nZ4aB7cD1fE",
    email: "john@example.com",
    emailVerified: false,
    disabled: false,
    metadata: {
        creationTimestamp: 1705747200,
        lastSignInTimestamp: null
    },
    providerData: [...]
}
```

**6. Laravel signe automatiquement l'utilisateur**
```php
$signInResult = $this->firebaseAuth->signInWithEmailAndPassword(
    $data['email'], 
    $data['password']
);
```

**7. Firebase génère les tokens JWT**
```
Firebase Cloud fait :
├─ Vérifie le mot de passe
├─ Génère un ID Token (JWT) valide 1h
├─ Génère un Refresh Token (pour renouveler)
└─ Retourne SignInResult avec les tokens
```

**8. Laravel reçoit les tokens**
```php
SignInResult Object {
    idToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    refreshToken: "AMf-vBz8kN1pQ3rY...",
    expiresIn: "3600",  // 1 heure
    localId: "Kl3mR8xP2nZ4aB7cD1fE"
}
```

**9. Laravel crée l'utilisateur en local (PostgreSQL)**
```php
$user = User::create([
    'firebase_uid' => $firebaseUser->uid,
    'name' => $data['name'],
    'email' => $data['email'],
    'password' => Hash::make($data['password']), // Hash local aussi
    'phone' => $data['phone'],
    'role' => $data['role'],
]);
```

**10. Réponse envoyée au frontend**
```json
{
  "source": "firebase",
  "message": "Utilisateur créé avec succès",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "AMf-vBz8kN1pQ3rY...",
  "expires_in": 3600,
  "uid": "Kl3mR8xP2nZ4aB7cD1fE",
  "user": {
    "id": 1,
    "firebase_uid": "Kl3mR8xP2nZ4aB7cD1fE",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### 2. Connexion d'un utilisateur (Login)

#### Étape par étape

**1. Frontend envoie les credentials**
```javascript
await axios.post('/api/login', {
  email: 'john@example.com',
  password: 'SecurePass123'
})
```

**2. Laravel appelle Firebase**
```php
$signInResult = $this->firebaseAuth->signInWithEmailAndPassword(
    $credentials['email'],
    $credentials['password']
);
```

**3. Firebase vérifie les credentials**
```
Firebase Cloud fait :
├─ Cherche l'utilisateur par email
├─ Compare le hash du password
│  ├─ bcrypt($password_fourni) === $password_stocké ?
│  └─ Utilise un algorithme sécurisé constant-time
├─ Si OK : Génère nouveaux tokens JWT
└─ Si KO : Lance InvalidPassword exception
```

**4. Firebase retourne les tokens**
```php
SignInResult Object {
    idToken: "eyJhbGciOiJSUzI1NiIs...",  // Nouveau token
    refreshToken: "BMg-wCa9lO2qR4sZ...",  // Nouveau refresh token
    expiresIn: "3600",
    localId: "Kl3mR8xP2nZ4aB7cD1fE"
}
```

**5. Laravel synchronise avec PostgreSQL**
```php
$user = User::updateOrCreate(
    ['email' => $credentials['email']],
    ['firebase_uid' => $signInResult->firebaseUserId()]
);
```

**Pourquoi updateOrCreate ?**
- Si l'utilisateur existe en Firebase mais pas en local → Le créer
- Si l'utilisateur existe en local mais n'a pas de firebase_uid → L'ajouter
- Si l'utilisateur existe déjà → Ne rien changer

**6. Réponse au frontend**
```json
{
  "source": "firebase",
  "token_type": "Bearer",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "BMg-wCa9lO2qR4sZ...",
  "expires_in": 3600,
  "uid": "Kl3mR8xP2nZ4aB7cD1fE",
  "user": {
    "id": 1,
    "firebase_uid": "Kl3mR8xP2nZ4aB7cD1fE",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

## 🔧 SDK PHP Firebase

### Installation

**Package Composer** : `kreait/firebase-php`

```bash
composer require kreait/firebase-php
```

### Configuration Laravel

**1. Fichier de credentials Firebase**

Télécharger depuis Firebase Console :
```
Project Settings → Service Accounts → Generate New Private Key
```

Fichier JSON généré : `firebase-credentials.json`
```json
{
  "type": "service_account",
  "project_id": "votre-projet-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxx@votre-projet.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**2. Variables d'environnement `.env`**
```env
FIREBASE_CREDENTIALS=/app/firebase/firebase-credentials.json
FIREBASE_PROJECT_ID=votre-projet-id
```

**3. Configuration `config/firebase.php`**
```php
return [
    'default' => 'app',
    'projects' => [
        'app' => [
            'credentials' => env('FIREBASE_CREDENTIALS'),
            'project_id' => env('FIREBASE_PROJECT_ID'),
        ],
    ],
];
```

**4. Service Provider (automatique avec le package)**

Le package enregistre automatiquement :
```php
$app->bind(FirebaseAuthContract::class, function ($app) {
    $factory = (new Factory)
        ->withServiceAccount(config('firebase.projects.app.credentials'));
    
    return $factory->createAuth();
});
```

**5. Injection dans le Controller**
```php
public function __construct(private readonly FirebaseAuthContract $firebaseAuth)
{
    // Laravel injecte automatiquement l'instance Firebase Auth
}
```

### Méthodes du SDK disponibles

```php
// Authentification
$this->firebaseAuth->signInWithEmailAndPassword($email, $password);
$this->firebaseAuth->signInAnonymously();
$this->firebaseAuth->signInWithCustomToken($token);

// Gestion des utilisateurs
$this->firebaseAuth->createUserWithEmailAndPassword($email, $password);
$this->firebaseAuth->getUser($uid);
$this->firebaseAuth->getUserByEmail($email);
$this->firebaseAuth->updateUser($uid, $properties);
$this->firebaseAuth->deleteUser($uid);
$this->firebaseAuth->listUsers($limit = 1000);

// Tokens
$this->firebaseAuth->verifyIdToken($idToken);
$this->firebaseAuth->revokeRefreshTokens($uid);

// Email
$this->firebaseAuth->sendEmailVerificationLink($email);
$this->firebaseAuth->sendPasswordResetLink($email);

// Custom claims (permissions personnalisées)
$this->firebaseAuth->setCustomUserClaims($uid, ['admin' => true]);
```

---

## 📋 Méthodes utilisées dans notre code

### 1. `createUserWithEmailAndPassword()`

**Signature**
```php
public function createUserWithEmailAndPassword(
    string $email, 
    string $password
): UserRecord
```

**Ce qu'elle fait**
1. Envoie une requête HTTPS POST à Firebase Auth API
2. Firebase crée l'utilisateur dans son cloud
3. Hash le mot de passe avec bcrypt (côté Firebase)
4. Génère un UID unique
5. Retourne un objet `UserRecord`

**Exemple de requête HTTP sous-jacente**
```http
POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=API_KEY
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123",
  "returnSecureToken": true
}
```

**Réponse Firebase**
```json
{
  "kind": "identitytoolkit#SignupNewUserResponse",
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "email": "john@example.com",
  "refreshToken": "AMf-vBz8kN1pQ3rY...",
  "expiresIn": "3600",
  "localId": "Kl3mR8xP2nZ4aB7cD1fE"
}
```

**Exceptions possibles**
```php
- DuplicateEmail : Email déjà utilisé
- InvalidEmail : Format email invalide
- WeakPassword : Mot de passe trop faible
- QuotaExceeded : Trop de créations de comptes
```

### 2. `signInWithEmailAndPassword()`

**Signature**
```php
public function signInWithEmailAndPassword(
    string $email, 
    string $password
): SignInResult
```

**Ce qu'elle fait**
1. Envoie une requête HTTPS POST à Firebase Auth API
2. Firebase vérifie le mot de passe (compare les hashs)
3. Génère un nouveau ID Token (JWT)
4. Génère un nouveau Refresh Token
5. Retourne un objet `SignInResult` avec les tokens

**Exemple de requête HTTP**
```http
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=API_KEY
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123",
  "returnSecureToken": true
}
```

**Réponse Firebase**
```json
{
  "kind": "identitytoolkit#VerifyPasswordResponse",
  "localId": "Kl3mR8xP2nZ4aB7cD1fE",
  "email": "john@example.com",
  "displayName": "",
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "registered": true,
  "refreshToken": "AMf-vBz8kN1pQ3rY...",
  "expiresIn": "3600"
}
```

**Méthodes disponibles sur SignInResult**
```php
$signInResult->idToken();           // string: JWT token
$signInResult->refreshToken();      // string: Refresh token
$signInResult->accessToken();       // string: Alias de idToken()
$signInResult->ttl();               // int: Secondes avant expiration
$signInResult->firebaseUserId();    // string: UID Firebase
```

**Exceptions possibles**
```php
- EmailNotFound : Utilisateur inexistant
- InvalidPassword : Mot de passe incorrect
- UserDisabled : Compte désactivé
- TooManyAttempts : Trop de tentatives échouées
```

### 3. `updateOrCreate()` (Eloquent Laravel)

**Ce n'est pas une méthode Firebase**, mais une méthode Laravel Eloquent très utile.

**Signature**
```php
Model::updateOrCreate(
    array $attributes,  // Conditions de recherche
    array $values       // Valeurs à mettre à jour/créer
): Model
```

**Logique**
```php
// Pseudo-code de ce que fait updateOrCreate
if (User::where($attributes)->exists()) {
    // L'utilisateur existe → UPDATE
    $user = User::where($attributes)->first();
    $user->update($values);
    return $user;
} else {
    // L'utilisateur n'existe pas → CREATE
    return User::create(array_merge($attributes, $values));
}
```

**Dans notre code**
```php
$user = User::updateOrCreate(
    ['email' => $credentials['email']],     // Cherche par email
    ['firebase_uid' => $signInResult->firebaseUserId()]  // Met à jour/crée avec UID
);
```

**Scénarios possibles**
1. **User existe avec firebase_uid** → Rien ne change
2. **User existe sans firebase_uid** → Ajoute le firebase_uid
3. **User n'existe pas** → Crée avec email + firebase_uid

---

## 🎟️ Tokens JWT Firebase

### Qu'est-ce qu'un JWT ?

**JWT** = JSON Web Token

**Structure d'un JWT** : `header.payload.signature`

**Exemple de token Firebase**
```
eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1Njc4OWFiY2RlZiJ9.
eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbW9uLXByb2pldCIsImF1ZCI6Im1vbi1wcm9qZXQiLCJhdXRoX3RpbWUiOjE3MDU3NDcyMDAsInVzZXJfaWQiOiJLbDNtUjh4UDJuWjRhQjdjRDFmRSIsInN1YiI6IktsM21SOHZQMG5aNGFCN2NEMWZFBSX0pYXQiOjE3MDU3NDcyMDAsImV4cCI6MTcwNTc1MDgwMCwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImpvaG5AZXhhbXBsZS5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.
k3l5m8n7p9q2r4s6t8v0w2x4y6z8a1b3c5d7e9f1g3h5i7j9k1l3m5n7o9p1q3r5
```

### Décodage d'un JWT

**Header** (encodé en Base64)
```json
{
  "alg": "RS256",                // Algorithme de signature (RSA 256 bits)
  "kid": "123456789abcdef"       // Key ID pour vérifier la signature
}
```

**Payload** (encodé en Base64)
```json
{
  "iss": "https://securetoken.google.com/mon-projet",  // Émetteur (Firebase)
  "aud": "mon-projet",                                  // Audience (projet ID)
  "auth_time": 1705747200,                              // Timestamp connexion
  "user_id": "Kl3mR8xP2nZ4aB7cD1fE",                   // UID utilisateur
  "sub": "Kl3mR8xP2nZ4aB7cD1fE",                       // Subject (même que user_id)
  "iat": 1705747200,                                    // Issued At
  "exp": 1705750800,                                    // Expiration (iat + 3600s)
  "email": "john@example.com",                          // Email utilisateur
  "email_verified": false,                              // Email vérifié ?
  "firebase": {
    "identities": {
      "email": ["john@example.com"]
    },
    "sign_in_provider": "password"                      // Méthode de connexion
  }
}
```

**Signature** (SHA256 avec clé privée Firebase)
```
RSASHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  firebase_private_key
)
```

### Comment Firebase vérifie un token

**Côté client (Frontend)** envoie le token
```javascript
axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`
```

**Côté serveur (Backend)** vérifie le token
```php
try {
    $verifiedToken = $this->firebaseAuth->verifyIdToken($idToken);
    
    // Token valide !
    $uid = $verifiedToken->claims()->get('sub');  // UID utilisateur
    $email = $verifiedToken->claims()->get('email');
    
} catch (InvalidToken $e) {
    // Token invalide, expiré ou falsifié
    return response()->json(['error' => 'Unauthorized'], 401);
}
```

**Vérifications effectuées par Firebase**
1. ✅ Token pas expiré (`exp` > now)
2. ✅ Signature valide (vérifie avec clés publiques Google)
3. ✅ Émetteur correct (`iss` = projet Firebase)
4. ✅ Audience correcte (`aud` = projet Firebase)
5. ✅ Pas révoqué (check dans Firebase)

### Refresh Token

**Problème** : ID Token expire après 1 heure

**Solution** : Refresh Token (valide 30 jours)

**Utilisation**
```javascript
// Quand ID Token expire (après 1h)
const response = await axios.post('https://securetoken.googleapis.com/v1/token', {
  grant_type: 'refresh_token',
  refresh_token: storedRefreshToken
})

// Firebase retourne un nouveau ID Token
const newIdToken = response.data.id_token
localStorage.setItem('token', newIdToken)
```

**Recommandation** : Implémenter auto-refresh 5min avant expiration

```javascript
// Vérifier expiration toutes les minutes
setInterval(() => {
  const tokenExpiry = parseJwt(idToken).exp * 1000
  const now = Date.now()
  
  if (tokenExpiry - now < 5 * 60 * 1000) {  // Moins de 5min restantes
    refreshToken()
  }
}, 60000)  // Check toutes les minutes
```

---

## 🔄 Flux complet d'authentification

### Diagramme de séquence REGISTER

```
Frontend          Laravel           Firebase Cloud      PostgreSQL
   │                 │                     │                │
   ├──POST register──►                     │                │
   │  (email, pwd)   │                     │                │
   │                 ├──validate()         │                │
   │                 │                     │                │
   │                 ├──createUser()──────►│                │
   │                 │                     ├─check email    │
   │                 │                     ├─hash password  │
   │                 │                     ├─generate UID   │
   │                 │◄──UserRecord────────┤                │
   │                 │   (uid)             │                │
   │                 │                     │                │
   │                 ├──signIn()──────────►│                │
   │                 │                     ├─verify password│
   │                 │                     ├─generate JWT   │
   │                 │◄──SignInResult──────┤                │
   │                 │   (tokens)          │                │
   │                 │                     │                │
   │                 ├──User::create()─────────────────────►│
   │                 │                     │                ├─INSERT user
   │                 │◄──$user─────────────────────────────┤
   │                 │                     │                │
   │◄──JSON Response─┤                     │                │
   │  (tokens, user) │                     │                │
   │                 │                     │                │
   ├─store tokens──► │                     │                │
   │  localStorage   │                     │                │
```

### Diagramme de séquence LOGIN

```
Frontend          Laravel           Firebase Cloud      PostgreSQL
   │                 │                     │                │
   ├──POST login─────►                     │                │
   │  (email, pwd)   │                     │                │
   │                 ├──validate()         │                │
   │                 │                     │                │
   │                 ├──signIn()──────────►│                │
   │                 │                     ├─find user      │
   │                 │                     ├─check password │
   │                 │                     ├─generate JWT   │
   │                 │◄──SignInResult──────┤                │
   │                 │   (tokens)          │                │
   │                 │                     │                │
   │                 ├──updateOrCreate()───────────────────►│
   │                 │                     │                ├─UPSERT user
   │                 │◄──$user─────────────────────────────┤
   │                 │                     │                │
   │◄──JSON Response─┤                     │                │
   │  (tokens, user) │                     │                │
   │                 │                     │                │
   ├─store tokens──► │                     │                │
   │  localStorage   │                     │                │
```

### Diagramme avec FALLBACK

```
Frontend          Laravel           Firebase Cloud      PostgreSQL
   │                 │                     │                │
   ├──POST login─────►                     │                │
   │  (email, pwd)   │                     │                │
   │                 ├──signIn()──────────►│                │
   │                 │                     ✗ TIMEOUT        │
   │                 │◄──Exception─────────┤                │
   │                 │                     │                │
   │                 ├──where('email')─────────────────────►│
   │                 │                     │                ├─SELECT user
   │                 │◄──$user─────────────────────────────┤
   │                 │                     │                │
   │                 ├──Hash::check()      │                │
   │                 │  ✓ Password OK      │                │
   │                 │                     │                │
   │◄──JSON Response─┤                     │                │
   │  (user only,    │                     │                │
   │   no tokens)    │                     │                │
```

---

## 🔧 Configuration Firebase

### 1. Créer un projet Firebase

1. Aller sur https://console.firebase.google.com
2. Cliquer "Add project"
3. Donner un nom au projet
4. Activer Google Analytics (optionnel)
5. Cliquer "Create project"

### 2. Activer Email/Password Authentication

1. Dans Firebase Console → "Authentication"
2. Onglet "Sign-in method"
3. Cliquer "Email/Password"
4. Toggle "Enable"
5. Sauvegarder

### 3. Générer les credentials pour le backend

1. Project Settings (roue dentée)
2. Onglet "Service accounts"
3. "Generate new private key"
4. Télécharger le fichier JSON
5. Placer dans `firebase/firebase-credentials.json`

**⚠️ ATTENTION** : Ne jamais commit ce fichier ! Ajouter à `.gitignore`

```gitignore
# .gitignore
firebase/firebase-credentials.json
```

### 4. Variables d'environnement

**`.env`**
```env
FIREBASE_CREDENTIALS=/app/firebase/firebase-credentials.json
FIREBASE_PROJECT_ID=mon-projet-12345
```

### 5. Docker volume (si nécessaire)

**`docker-compose.yml`**
```yaml
services:
  app:
    volumes:
      - ./firebase:/app/firebase:ro  # Read-only
```

---

## ✅ Avantages de Firebase Authentication

### 1. **Sécurité renforcée**
- ✅ Hash bcrypt automatique
- ✅ Protection contre brute-force intégrée
- ✅ Détection d'activités suspectes
- ✅ Tokens JWT signés et vérifiables
- ✅ Révocation de tokens possible

### 2. **Scalabilité**
- ✅ Infrastructure Google Cloud
- ✅ Gère des millions d'utilisateurs
- ✅ Pas de gestion de serveurs
- ✅ Auto-scaling automatique

### 3. **Fonctionnalités avancées**
- ✅ Multi-provider (Google, Facebook, etc.)
- ✅ Authentification anonyme
- ✅ Authentification par téléphone (SMS)
- ✅ Email verification automatique
- ✅ Password reset intégré
- ✅ Custom claims (permissions)

### 4. **Développement rapide**
- ✅ SDK disponibles (JS, iOS, Android, PHP)
- ✅ UI pré-construites (FirebaseUI)
- ✅ Documentation complète
- ✅ Exemples de code

### 5. **Monitoring et Analytics**
- ✅ Dashboard Firebase Console
- ✅ Statistiques d'utilisation
- ✅ Logs d'authentification
- ✅ Détection d'anomalies

---

## ❌ Inconvénients de Firebase Authentication

### 1. **Dépendance à Google**
- ❌ Vendor lock-in
- ❌ Besoin d'Internet pour fonctionner
- ❌ Tarification Firebase peut changer

### 2. **Limitations fonctionnelles**
- ❌ Pas de gestion de rôles natives
- ❌ Pas de champs personnalisés (name, phone → à gérer en local)
- ❌ Custom claims limités à 1000 bytes

### 3. **Coûts**
- ❌ Gratuit jusqu'à 50 000 MAU (Monthly Active Users)
- ❌ Payant au-delà : $0.0055 par utilisateur vérifié
- ❌ SMS auth coûteux ($0.05 par vérification)

### 4. **Complexité**
- ❌ Configuration initiale plus longue
- ❌ Gestion des credentials JSON
- ❌ Debugging plus difficile (logs externes)

### 5. **Offline**
- ❌ Nécessite connexion Internet côté backend
- ❌ Pas de mode offline natif (d'où notre fallback PostgreSQL)

---

## ⚖️ Comparaison avec Auth Traditionnelle

| Aspect                 | Firebase Auth                      | Auth Traditionnelle Laravel         |
|------------------------|------------------------------------|------------------------------------|
| **Stockage users**     | Firebase Cloud + PostgreSQL local  | PostgreSQL uniquement              |
| **Hashing password**   | Bcrypt côté Firebase               | Bcrypt côté Laravel                |
| **Tokens**             | JWT Firebase (1h validité)         | Laravel Sanctum (pas d'expiration) |
| **Scalabilité**        | ✅ Très haute (Google infra)       | Dépend du serveur                  |
| **Offline**            | ❌ Nécessite Internet              | ✅ Fonctionne toujours             |
| **Configuration**      | ❌ Plus complexe (credentials)     | ✅ Simple (base de données)        |
| **Multi-provider**     | ✅ Natif (Google, FB, etc.)        | ❌ À implémenter manuellement      |
| **Coûts**              | Gratuit puis payant (50k+ users)   | Inclus (coût serveur)              |
| **Vendor lock-in**     | ❌ Dépendance à Google             | ✅ Indépendant                     |
| **Email verification** | ✅ Automatique                     | À implémenter                      |
| **Password reset**     | ✅ Automatique                     | À implémenter                      |
| **2FA**                | ✅ Natif                           | Package externe                    |

---

## 🎓 Conclusion

### Ce qu'il faut retenir

1. **Firebase Auth = Service cloud** qui gère l'authentification
2. **SDK PHP** permet d'appeler Firebase depuis Laravel
3. **Tokens JWT** permettent d'authentifier les requêtes API
4. **Dual storage** : Firebase Cloud + PostgreSQL local
5. **Fallback PostgreSQL** assure la disponibilité

### Quand utiliser Firebase Auth ?

✅ **OUI** si :
- Application mobile (iOS/Android)
- Besoin multi-provider (Google, Facebook)
- Scalabilité importante prévue
- Peu de temps pour développer l'auth
- Besoin 2FA / SMS verification

❌ **NON** si :
- Application purement backend
- Besoin 100% offline
- Budget très limité
- Beaucoup de champs utilisateur personnalisés
- Préférence pour tout contrôler en local

### Notre approche hybride

```
Firebase (prioritaire)  +  PostgreSQL (fallback)  =  Haute disponibilité
```

**Meilleur des deux mondes** :
- Sécurité et scalabilité de Firebase
- Disponibilité et contrôle de PostgreSQL

---

**Version** : 1.0  
**Date** : 20 janvier 2026  
**Auteur** : Documentation pédagogique pour projet S5 Cloud Final
