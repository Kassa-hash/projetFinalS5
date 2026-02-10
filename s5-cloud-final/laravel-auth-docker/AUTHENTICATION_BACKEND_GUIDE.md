# Guide d'Authentification Backend - Laravel + Firebase + PostgreSQL

## 📚 Introduction

Ce guide explique en détail le fonctionnement du système d'authentification hybride mis en place dans le backend Laravel. Le système utilise **Firebase Authentication** comme méthode principale avec un **fallback PostgreSQL** pour assurer la disponibilité du service même si Firebase est indisponible.

---

## 🎯 Objectifs du Système

1. **Double authentification** : Firebase (cloud) + PostgreSQL (local)
2. **Haute disponibilité** : Fonctionner même si Firebase est down
3. **Gestion des rôles** : Visitor, User, Manager
4. **Sécurité renforcée** : Verrouillage de compte, throttling
5. **Tokens JWT** : Pour authentifier les requêtes API

---

## 🏗️ Architecture du Système

```
┌─────────────────┐
│   Frontend      │
│   (Vue.js)      │
└────────┬────────┘
         │ HTTP Request (POST /api/login)
         ▼
┌─────────────────────────────────────────┐
│   Laravel API (FirebaseAuthController)   │
│                                           │
│   ┌───────────────────────────────┐     │
│   │ 1. Validation des données     │     │
│   └───────────┬───────────────────┘     │
│               ▼                           │
│   ┌───────────────────────────────┐     │
│   │ 2. Tentative Firebase          │     │
│   └───────────┬───────────────────┘     │
│               │                           │
│       ┌───────┴────────┐                │
│       │ Success?       │                │
│       └───────┬────────┘                │
│          OUI  │  NON                    │
│       ┌───────▼────────┐                │
│       │                │                │
│   ┌───▼───┐     ┌──────▼──────┐       │
│   │Firebase│     │  Fallback   │       │
│   │ Token  │     │ PostgreSQL  │       │
│   └────────┘     └─────────────┘       │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Base de données│
│   PostgreSQL    │
└─────────────────┘
```

---

## 📂 Structure des Fichiers

### 1. Controller Principal : `FirebaseAuthController.php`

**Emplacement** : `app/Http/Controllers/FirebaseAuthController.php`

**Rôle** : Gérer toute la logique d'authentification (login, register, logout)

**Dépendances injectées** :
```php
public function __construct(private readonly FirebaseAuthContract $firebaseAuth)
```
- `FirebaseAuthContract` : Interface Firebase injectée automatiquement par Laravel

### 2. Modèle : `User.php`

**Emplacement** : `app/Models/User.php`

**Champs de la table `users`** :
```php
protected $fillable = [
    'firebase_uid',      // UID Firebase (nullable, unique)
    'name',              // Nom complet
    'email',             // Email (unique)
    'password',          // Mot de passe hashé
    'phone',             // Téléphone (nullable)
    'role',              // Rôle: visitor, user, manager
    'account_lockout',   // Compte verrouillé (boolean)
];
```

**Casts** :
```php
protected function casts(): array {
    return [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',          // Auto-hash avec bcrypt
        'account_lockout' => 'boolean',  // Cast en booléen
    ];
}
```

### 3. Routes API : `routes/api.php`

**Routes publiques** (avec throttling 60 requêtes/minute) :
```php
POST /api/login      → FirebaseAuthController@login
POST /api/register   → FirebaseAuthController@register
```

**Routes protégées** (nécessitent `auth:sanctum`) :
```php
POST /api/logout     → FirebaseAuthController@logout
```

### 4. Configuration Firebase : `config/firebase.php`

Charge le fichier credentials JSON de Firebase et configure le SDK.

### 5. Migration : `database/migrations/0001_01_01_000000_create_users_table.php`

Crée la table `users` avec tous les champs nécessaires.

---

## 🔐 Flux d'Authentification Détaillé

### 📥 1. LOGIN (POST /api/login)

#### Étape 1 : Validation des données
```php
$credentials = $request->validate([
    'email' => ['required', 'email'],
    'password' => ['required', 'string'],
]);
```
- Vérifie que l'email est valide
- Vérifie que le mot de passe est présent

#### Étape 2 : Tentative d'authentification Firebase
```php
try {
    $signInResult = $this->firebaseAuth->signInWithEmailAndPassword(
        $credentials['email'],
        $credentials['password']
    );
    
    // Synchroniser avec PostgreSQL
    $user = User::updateOrCreate(
        ['email' => $credentials['email']],
        ['firebase_uid' => $signInResult->firebaseUserId()]
    );
    
    return response()->json([
        'source' => 'firebase',
        'id_token' => $signInResult->idToken(),      // Token JWT
        'refresh_token' => $signInResult->refreshToken(),
        'expires_in' => $signInResult->ttl(),
        'uid' => $signInResult->firebaseUserId(),
        'user' => $user,
    ]);
}
```

**Si Firebase réussit** :
- Obtenir les tokens Firebase (JWT)
- Synchroniser l'utilisateur dans PostgreSQL avec `updateOrCreate()`
- Retourner les tokens + infos utilisateur

#### Étape 3 : Fallback PostgreSQL (si Firebase échoue)
```php
catch (AuthException|FirebaseException|Throwable $exception) {
    $firebaseError = $exception->getMessage();
}

// Chercher l'utilisateur en local
$user = User::where('email', $credentials['email'])->first();

if ($user !== null && Hash::check($credentials['password'], $user->password)) {
    // Vérifier si le compte est verrouillé
    if ($user->account_lockout) {
        throw ValidationException::withMessages([
            'email' => ['Ce compte est verrouillé.'],
        ]);
    }
    
    return response()->json([
        'source' => 'postgres',
        'message' => 'Authenticated locally because Firebase could not be reached.',
        'user' => $user,
        'firebase_error' => $firebaseError,
    ]);
}
```

**Si Firebase échoue** :
- Rechercher l'utilisateur dans PostgreSQL
- Vérifier le mot de passe avec `Hash::check()`
- Vérifier que le compte n'est pas verrouillé
- Retourner l'utilisateur (sans token Firebase)

#### Étape 4 : Échec complet
```php
throw ValidationException::withMessages([
    'email' => ['Email ou mot de passe incorrect.'],
]);
```

**Résumé du flux LOGIN** :
```
1. Validation → OK
2. Firebase Auth → OK ? ✅ Retourner tokens Firebase
                     ❌ Passer à l'étape 3
3. PostgreSQL Auth → OK ? ✅ Retourner user sans tokens
                       ❌ Erreur 422
```

---

### 📝 2. REGISTER (POST /api/register)

#### Étape 1 : Validation des données
```php
$data = $request->validate([
    'name' => ['required', 'string', 'max:255'],
    'email' => ['required', 'email', 'unique:users'],
    'password' => ['required', 'string', 'min:8', 'confirmed'],
    'phone' => ['nullable', 'string', 'max:20'],
    'role' => ['required', 'in:user,manager'],
]);
```

**Règles de validation** :
- `name` : Obligatoire, max 255 caractères
- `email` : Obligatoire, format email, **unique** dans la table users
- `password` : Obligatoire, min 8 caractères, **confirmé** (password_confirmation)
- `phone` : Optionnel, max 20 caractères
- `role` : Obligatoire, doit être "user" ou "manager"

#### Étape 2 : Créer l'utilisateur dans Firebase
```php
try {
    // Créer dans Firebase
    $firebaseUser = $this->firebaseAuth->createUserWithEmailAndPassword(
        $data['email'], 
        $data['password']
    );
    
    // Signer immédiatement pour obtenir les tokens
    $signInResult = $this->firebaseAuth->signInWithEmailAndPassword(
        $data['email'], 
        $data['password']
    );
    
    // Créer dans PostgreSQL avec l'UID Firebase
    $user = User::create([
        'firebase_uid' => $firebaseUser->uid,
        'name' => $data['name'],
        'email' => $data['email'],
        'password' => Hash::make($data['password']), // Hash avec bcrypt
        'phone' => $data['phone'] ?? null,
        'role' => $data['role'],
    ]);
    
    return response()->json([
        'source' => 'firebase',
        'message' => 'Utilisateur créé avec succès',
        'id_token' => $signInResult->idToken(),
        'refresh_token' => $signInResult->refreshToken(),
        'expires_in' => $signInResult->ttl(),
        'uid' => $firebaseUser->uid,
        'user' => $user,
    ], 201);
}
```

**Processus Firebase réussi** :
1. Créer l'utilisateur dans Firebase
2. Signer automatiquement l'utilisateur (obtenir tokens)
3. Créer l'utilisateur dans PostgreSQL avec le `firebase_uid`
4. Retourner tokens + utilisateur (code 201 Created)

#### Étape 3 : Fallback PostgreSQL (si Firebase échoue)
```php
catch (AuthException|FirebaseException|Throwable $exception) {
    $firebaseError = $exception->getMessage();
}

// Vérifier que l'email n'existe pas déjà
$existing = User::where('email', $data['email'])->first();
if ($existing) {
    return response()->json(
        ['error' => 'Email déjà utilisé', 'firebase_error' => $firebaseError],
        409
    );
}

// Créer uniquement dans PostgreSQL (sans firebase_uid)
$user = User::create([
    'name' => $data['name'],
    'email' => $data['email'],
    'password' => Hash::make($data['password']),
    'phone' => $data['phone'] ?? null,
    'role' => $data['role'],
]);

return response()->json([
    'source' => 'postgres',
    'message' => 'Utilisateur créé localement (Firebase indisponible)',
    'user' => $user,
    'firebase_error' => $firebaseError,
], 201);
```

**Résumé du flux REGISTER** :
```
1. Validation → OK
2. Firebase Create → OK ? ✅ Créer dans PostgreSQL avec firebase_uid
                       ❌ Passer à l'étape 3
3. PostgreSQL Create → OK ? ✅ Créer user local sans firebase_uid
                         ❌ Erreur 409 (email déjà utilisé)
```

---

### 🚪 3. LOGOUT (POST /api/logout)

**Note** : La route logout existe dans `routes/api.php` mais la méthode n'est pas encore implémentée dans le controller.

**Implémentation suggérée** :
```php
public function logout(Request $request): JsonResponse
{
    // Révoquer le token Sanctum
    $request->user()->currentAccessToken()->delete();
    
    return response()->json([
        'message' => 'Déconnexion réussie'
    ]);
}
```

---

## 🛡️ Sécurité

### 1. Throttling (Limitation de taux)

**Configuration** dans `routes/api.php` :
```php
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/login', ...);
    Route::post('/register', ...);
});
```

- **60 requêtes maximum par minute** par IP
- Protection contre les attaques brute-force
- Retourne une erreur 429 (Too Many Requests) si dépassé

### 2. Hashing des mots de passe

**Méthode** : bcrypt via `Hash::make()`
```php
'password' => Hash::make($data['password'])
```

**Vérification** :
```php
Hash::check($credentials['password'], $user->password)
```

- Bcrypt avec salt automatique
- Impossible de récupérer le mot de passe original
- Résistant aux attaques rainbow tables

### 3. Verrouillage de compte

**Champ** : `account_lockout` (boolean)

**Vérification** dans le login :
```php
if ($user->account_lockout) {
    throw ValidationException::withMessages([
        'email' => ['Ce compte est verrouillé.'],
    ]);
}
```

**Utilisation** :
- Bloquer les comptes suspects
- Verrouillage temporaire après X tentatives échouées
- Déverrouillage manuel par administrateur

### 4. Validation stricte

**Règles de validation** :
- Email : Format RFC 5322
- Password : Minimum 8 caractères
- Password confirmation : Doit matcher
- Email unique : Empêche les doublons
- Role : Enum strict (user, manager)

### 5. CORS (Cross-Origin Resource Sharing)

**Configuration Laravel** pour accepter les requêtes du frontend :
```php
// Dans config/cors.php ou middleware
'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],
'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],
'allowed_headers' => ['Content-Type', 'Authorization'],
```

---

## 🔑 Gestion des Tokens

### 1. Tokens Firebase (JWT)

**Structure d'un token Firebase** :
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQ1...",
  "refresh_token": "AMf-vBz...",
  "expires_in": 3600,
  "uid": "firebase_user_unique_id"
}
```

**Propriétés** :
- `id_token` : Token JWT pour authentifier les requêtes
- `refresh_token` : Pour obtenir un nouveau id_token après expiration
- `expires_in` : Durée de validité en secondes (3600 = 1h)
- `uid` : Identifiant unique Firebase

**Utilisation côté frontend** :
```javascript
// Stocker le token
localStorage.setItem('token', response.id_token)

// Envoyer dans les requêtes
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

### 2. Tokens Laravel Sanctum (pour fallback PostgreSQL)

**Quand le créer ?** :
```php
$token = $user->createToken('auth-token')->plainTextToken;
```

**Avantages** :
- Stocké dans la base de données
- Peut être révoqué facilement
- Pas d'expiration par défaut

**Note** : Actuellement non implémenté dans le controller, mais recommandé pour le fallback PostgreSQL.

---

## 📊 Base de Données

### Table `users`

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    firebase_uid VARCHAR(255) UNIQUE NULLABLE,  -- UID Firebase (null si local only)
    name VARCHAR(255) NULLABLE,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULLABLE,
    password VARCHAR(255) NOT NULL,             -- Hash bcrypt
    phone VARCHAR(20) NULLABLE,
    role ENUM('visitor', 'user', 'manager') DEFAULT 'user',
    account_lockout BOOLEAN DEFAULT FALSE,
    remember_token VARCHAR(100) NULLABLE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Indexes** :
- PRIMARY KEY sur `id`
- UNIQUE sur `email`
- UNIQUE sur `firebase_uid`

### Relations

**Actuellement** : Aucune relation définie

**Extensions possibles** :
```php
// Dans User.php
public function posts() {
    return $this->hasMany(Post::class);
}

public function roles() {
    return $this->belongsToMany(Role::class); // Pour système de permissions complexe
}
```

---

## 🎭 Gestion des Rôles

### Rôles Disponibles

| Rôle      | Permissions                          | Utilisation                        |
|-----------|--------------------------------------|------------------------------------|
| `visitor` | Lecture seule                        | Utilisateur non inscrit (futur)    |
| `user`    | CRUD sur ses propres données         | Utilisateur standard               |
| `manager` | CRUD + administration                | Administrateur                     |

### Implémentation côté Backend

**Middleware personnalisé** (à créer) :
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

**Utilisation dans les routes** :
```php
Route::middleware(['auth:sanctum', 'role:manager'])->group(function () {
    Route::get('/admin/users', [AdminController::class, 'index']);
});
```

### Vérification dans le Controller

```php
public function delete(Request $request, $id)
{
    if ($request->user()->role !== 'manager') {
        return response()->json(['error' => 'Forbidden'], 403);
    }
    
    User::findOrFail($id)->delete();
    return response()->json(['message' => 'User deleted']);
}
```

---

## 🔄 Synchronisation Firebase ↔ PostgreSQL

### Stratégie : Dual Write

**Principe** : Écrire dans les deux systèmes simultanément

**Avantages** :
- Redondance des données
- Fallback automatique
- Pas de perte de données

**Inconvénients** :
- Légère augmentation du temps de réponse
- Gestion de la cohérence

### Méthode `updateOrCreate()`

```php
$user = User::updateOrCreate(
    ['email' => $credentials['email']],     // Condition de recherche
    ['firebase_uid' => $signInResult->firebaseUserId()]  // Données à mettre à jour
);
```

**Comportement** :
1. Chercher un utilisateur avec cet email
2. Si trouvé : Mettre à jour le `firebase_uid`
3. Si non trouvé : Créer un nouvel enregistrement

**Cas d'usage** :
- User créé dans Firebase mais pas encore en local
- User créé en local puis migré vers Firebase
- Synchronisation après reconnexion Firebase

---

## 🧪 Tests et Débogage

### 1. Tester l'authentification Firebase

**Vérifier la configuration** :
```bash
docker exec laravel_app php artisan tinker

>>> app('firebase.auth')->getUser('some-firebase-uid')
```

### 2. Tester l'authentification locale

**Via Tinker** :
```php
$user = User::where('email', 'test@example.com')->first();
Hash::check('password123', $user->password); // true ou false
```

### 3. Logs Laravel

**Ajouter des logs** dans le controller :
```php
use Illuminate\Support\Facades\Log;

Log::info('Firebase login attempt', ['email' => $credentials['email']]);
Log::error('Firebase auth failed', ['error' => $exception->getMessage()]);
```

**Voir les logs** :
```bash
docker exec laravel_app tail -f storage/logs/laravel.log
```

### 4. Tester avec Postman/Insomnia

**Exemple requête LOGIN** :
```http
POST http://localhost:8000/api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Exemple requête REGISTER** :
```http
POST http://localhost:8000/api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass",
  "password_confirmation": "securepass",
  "phone": "+33612345678",
  "role": "user"
}
```

---

## 🚨 Gestion des Erreurs

### Types d'erreurs

| Code | Type                      | Signification                          |
|------|---------------------------|----------------------------------------|
| 200  | OK                        | Succès                                 |
| 201  | Created                   | Ressource créée                        |
| 401  | Unauthorized              | Token invalide ou manquant             |
| 403  | Forbidden                 | Accès interdit (rôle insuffisant)      |
| 409  | Conflict                  | Email déjà utilisé                     |
| 422  | Unprocessable Entity      | Validation échouée                     |
| 429  | Too Many Requests         | Throttling dépassé                     |
| 500  | Internal Server Error     | Erreur serveur                         |

### Format des réponses d'erreur

**Erreur de validation** (422) :
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

**Erreur Firebase** (200 avec source postgres) :
```json
{
  "source": "postgres",
  "message": "Authenticated locally because Firebase could not be reached.",
  "user": { ... },
  "firebase_error": "Failed to connect to Firebase: Connection timeout"
}
```

---

## 🔧 Configuration Environnement

### Variables `.env` importantes

```env
# Database
DB_CONNECTION=pgsql
DB_HOST=db
DB_PORT=5432
DB_DATABASE=laravel
DB_USERNAME=laravel_user
DB_PASSWORD=secret

# Firebase
FIREBASE_CREDENTIALS=/path/to/firebase-credentials.json

# App
APP_KEY=base64:...
APP_URL=http://localhost:8000
```

### Commandes Laravel utiles

```bash
# Migrations
docker exec laravel_app php artisan migrate
docker exec laravel_app php artisan migrate:fresh  # Reset + migrate

# Cache
docker exec laravel_app php artisan config:clear
docker exec laravel_app php artisan cache:clear

# Routes
docker exec laravel_app php artisan route:list

# Console interactive
docker exec -it laravel_app php artisan tinker
```

---

## 📈 Améliorations Futures

### 1. Implémenter le logout Firebase

```php
public function logout(Request $request): JsonResponse
{
    try {
        // Révoquer le token Firebase si présent
        $idToken = $request->bearerToken();
        if ($idToken) {
            $this->firebaseAuth->revokeRefreshTokens($request->user()->firebase_uid);
        }
    } catch (\Exception $e) {
        Log::warning('Firebase logout failed', ['error' => $e->getMessage()]);
    }
    
    // Révoquer le token Sanctum
    $request->user()->currentAccessToken()->delete();
    
    return response()->json(['message' => 'Logged out successfully']);
}
```

### 2. Rate limiting avancé

```php
// Limiter par utilisateur au lieu de par IP
RateLimiter::for('login', function (Request $request) {
    return Limit::perMinute(5)->by($request->email);
});
```

### 3. Tentatives de connexion échouées

```php
// Verrouiller après 5 tentatives
$user->increment('login_attempts');
if ($user->login_attempts >= 5) {
    $user->update(['account_lockout' => true, 'locked_until' => now()->addMinutes(15)]);
}
```

### 4. Refresh token automatique

```php
public function refresh(Request $request): JsonResponse
{
    $refreshToken = $request->input('refresh_token');
    
    $newToken = $this->firebaseAuth->verifyIdToken($refreshToken);
    
    return response()->json(['id_token' => $newToken]);
}
```

### 5. Vérification d'email

```php
// Envoyer email de vérification
$this->firebaseAuth->sendEmailVerificationLink($email);

// Vérifier l'email
public function verifyEmail($token) {
    // Logique de vérification
}
```

---

## 📚 Ressources

### Documentation officielle
- [Laravel Authentication](https://laravel.com/docs/11.x/authentication)
- [Laravel Sanctum](https://laravel.com/docs/11.x/sanctum)
- [Firebase Admin SDK PHP](https://firebase-php.readthedocs.io/)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

### Packages utilisés
- `kreait/firebase-php` : SDK Firebase pour PHP
- `laravel/sanctum` : Authentification API tokens

### Commandes CLI utiles

```bash
# Créer un utilisateur en console
php artisan tinker
>>> User::create(['email' => 'admin@example.com', 'password' => Hash::make('password'), 'role' => 'manager'])

# Voir les routes API
php artisan route:list --path=api

# Créer un middleware personnalisé
php artisan make:middleware CheckUserRole

# Créer un test
php artisan make:test AuthenticationTest
```

---

## 🎓 Concepts Clés à Retenir

### 1. Dependency Injection
```php
public function __construct(private readonly FirebaseAuthContract $firebaseAuth)
```
Laravel injecte automatiquement l'instance Firebase configurée.

### 2. Try-Catch pour Fallback
```php
try {
    // Tentative Firebase
} catch (Exception $e) {
    // Fallback PostgreSQL
}
```
Pattern essentiel pour la haute disponibilité.

### 3. updateOrCreate() pour Synchronisation
```php
User::updateOrCreate($condition, $data);
```
Upsert en une seule requête SQL.

### 4. Hash::check() pour Vérification
```php
Hash::check($plainPassword, $hashedPassword)
```
Jamais comparer les hashes directement avec `===`.

### 5. ValidationException pour Erreurs Métier
```php
throw ValidationException::withMessages(['email' => ['Message']]);
```
Retourne automatiquement une réponse 422 avec le bon format.

---

## 🏁 Conclusion

Ce système d'authentification hybride offre :

✅ **Fiabilité** : Fonctionne même si Firebase est down  
✅ **Sécurité** : Hashing bcrypt, throttling, verrouillage  
✅ **Flexibilité** : Support de 3 rôles utilisateurs  
✅ **Scalabilité** : Firebase pour la charge cloud, PostgreSQL pour le backup  
✅ **Maintenabilité** : Code clair avec gestion d'erreurs explicite  

**Prochaines étapes recommandées** :
1. Implémenter la méthode `logout()`
2. Ajouter les middlewares de rôles
3. Créer des tests unitaires
4. Configurer les credentials Firebase
5. Documenter les endpoints avec Swagger/OpenAPI

---

**Version** : 1.0  
**Date** : 20 janvier 2026  
**Auteur** : Documentation générée pour le projet S5 Cloud Final
