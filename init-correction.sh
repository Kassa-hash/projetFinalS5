#!/bin/bash

# Script d'initialisation pour la correction du projet
# Ce script prépare la base de données avec le manager par défaut

echo "🚀 Initialisation de la base de données pour la correction..."
echo ""

# Vérifier que Docker est en cours d'exécution
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Erreur: Docker n'est pas démarré. Veuillez démarrer Docker Desktop."
    exit 1
fi

# Se placer dans le répertoire du backend
cd "$(dirname "$0")/s5-cloud-final/laravel-auth-docker" || exit 1

echo "1️⃣ Démarrage des conteneurs Docker..."
docker-compose up -d

echo ""
echo "2️⃣ Attente du démarrage de PostgreSQL (10 secondes)..."
sleep 10

echo ""
echo "3️⃣ Installation des dépendances PHP..."
docker-compose exec -T app composer install --no-interaction --prefer-dist --optimize-autoloader

echo ""
echo "4️⃣ Génération de la clé d'application Laravel..."
docker-compose exec -T app php artisan key:generate --force

echo ""
echo "5️⃣ Exécution des migrations de la base de données..."
docker-compose exec -T app php artisan migrate --force

echo ""
echo "6️⃣ Insertion du manager par défaut..."
docker-compose exec -T app php artisan db:seed --force

echo ""
echo "7️⃣ Insertion des prix par m² dans la base de données..."
docker-compose exec -T db psql -U laraveluser -d laravel < migration_prix_par_m2.sql

echo ""
echo "✅ Initialisation terminée avec succès!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📧 Compte Manager par défaut créé:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Email     : manager@projet.mg"
echo "   Password  : Manager123!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Backend Laravel : http://localhost:8000"
echo ""
echo "Pour démarrer le frontend Vue.js :"
echo "   cd s5-cloud-final/frontend-vueJS/frontend-vueJS"
echo "   npm install"
echo "   npm run dev"
echo ""
