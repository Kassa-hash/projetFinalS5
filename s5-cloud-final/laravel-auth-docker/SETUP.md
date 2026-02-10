# Setup rapide — laravel-auth-docker

Ce document liste les étapes et commandes pour cloner et démarrer ce projet (Docker) sur une machine de développement.

Prérequis
- Git
- Docker Desktop (ou Docker + docker-compose)
- (Optionnel) Node.js + npm si vous préférez builder localement
- (Optionnel) Composer si vous voulez installer les dépendances hors conteneur

Étapes (Windows PowerShell / WSL ou macOS/Linux)

1) Cloner le repo

```bash
git clone <URL_DU_REPO>
cd laravel-auth-docker
```

2) Copier le fichier .env (s'il n'existe pas)

```bash
# si .env.example existe
cp .env.example .env
# sinon vérifier et adapter .env fourni
```

3) (Optionnel) Placer les credentials Firebase
- Si vous utilisez Firebase, mettez le fichier JSON du service account à : `./firebase/firebase-credentials.json`
- Dans le `.env` :
  - `FIREBASE_CREDENTIALS=/var/www/firebase/firebase-credentials.json`
  - `FIREBASE_PROJECT_ID=ton-project-id`

4) Installer dépendances PHP (depuis l'hôte ou dans le conteneur)

- Hors conteneur (requiert Composer installé localement):

```bash
composer install --no-interaction --prefer-dist --optimize-autoloader
```

- Dans le conteneur (recommande si tu n'as pas composer localement):

```bash
docker compose run --rm app composer install --no-interaction --prefer-dist --optimize-autoloader
```

5) Installer / builder les assets (npm)

- Local (si Node installé):

```bash
npm install
npm run build    # ou `npm run dev` pour watch
```

- Dans un conteneur Node (déjà défini dans `docker-compose.yml`):

```bash
# une exécution ponctuelle pour installer et builder
docker compose run --rm node npm install
docker compose run --rm node npm run build

# ou lancer le service node en watch
docker compose up node
```

6) Démarrer les services Docker

```bash
# démarrer tout (rebuild si nécessaire)
docker compose up -d --build

# (ou démarrer seulement l'app/web/db)
docker compose up -d --build app web db
```

7) Générer la clé et exécuter les migrations

```bash
# dans le conteneur app
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate --force
# vider les caches si besoin
docker compose exec app php artisan config:clear
docker compose exec app php artisan cache:clear
docker compose exec app php artisan optimize:clear
```

8) (Optionnel) Publier la config Firebase (si besoin)

```bash
docker compose exec app php artisan vendor:publish --provider="Kreait\Laravel\Firebase\ServiceProvider" --tag=config
```

9) Vérifier les routes

```bash
docker compose exec app php artisan route:list --path=api/firebase
```

10) Tester l'API

PowerShell (Invoke-RestMethod) :

```powershell
Invoke-RestMethod -Uri 'http://localhost:8000/api/firebase/register' -Method Post -Body (@{name='Test'; email='ton@mail.com'; password='motdepasse'} | ConvertTo-Json) -ContentType 'application/json'

Invoke-RestMethod -Uri 'http://localhost:8000/api/firebase/login' -Method Post -Body (@{email='ton@mail.com'; password='motdepasse'} | ConvertTo-Json) -ContentType 'application/json'
```

Curl (bash / WSL / single-line PowerShell):

```bash
curl -X POST "http://localhost:8000/api/firebase/register" -H "Content-Type: application/json" -d '{"name":"Test","email":"ton@mail.com","password":"motdepasse"}'

curl -X POST "http://localhost:8000/api/firebase/login" -H "Content-Type: application/json" -d '{"email":"ton@mail.com","password":"motdepasse"}'
```

Notes importantes
- Le projet sert l'application via nginx sur le port `8000`. Ouvre `http://localhost:8000`.
- Si Firebase est indisponible, l'API bascule sur une authentification/fallback local (Postgres) selon l'implémentation actuelle.
- Place bien le fichier `firebase/firebase-credentials.json` au bon endroit (mappé par le volume), et ne commite pas ce fichier dans Git.
- Pour arrêter : `docker compose down`.

Dépannage rapide
- Voir logs :

```bash
docker compose logs web
docker compose logs app
docker compose logs db
```

- Lister containers :

```bash
docker compose ps
```

- Exécuter une commande interactive dans `app` :

```bash
docker compose exec app bash
```

Questions / suggestions
- Souhaitez-vous que je génère un token uniforme (Laravel Sanctum/JWT) pour les utilisateurs créés localement afin d'homogénéiser les réponses entre `firebase` et `postgres` ?

---
