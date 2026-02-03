#!/bin/bash

# Créer le lien symbolique pour le stockage public
php artisan storage:link

# Exécuter les migrations
php artisan migrate

# Démarrer PHP-FPM
php-fpm
