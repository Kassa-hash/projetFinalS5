# Instructions pour insérer les données d'exemple

## Option 1 : Via psql (Terminal)

```bash
# Se connecter au conteneur PostgreSQL
docker-compose exec db psql -U laraveluser -d laravel

# Puis exécuter les commandes SQL du fichier exemples_donnees.sql
\i /var/lib/postgresql/exemples_donnees.sql
```

## Option 2 : Copier les fichiers SQL et les exécuter

```bash
# Copier les fichiers SQL dans le conteneur
docker cp exemples_donnees.sql laravel_db:/tmp/
docker cp exemples_photos.sql laravel_db:/tmp/

# Exécuter les fichiers
docker exec laravel_db psql -U laraveluser -d laravel -f /tmp/exemples_donnees.sql
docker exec laravel_db psql -U laraveluser -d laravel -f /tmp/exemples_photos.sql
```

## Option 3 : Via DBeaver ou autre client PostgreSQL

- Host: localhost
- Port: 5432
- Database: laravel
- User: laraveluser
- Password: secret

Puis copier-coller le contenu des fichiers SQL.

## Données créées

### Problèmes routiers d'exemple:
1. **Nid de poule Rue de France** - Nouveau, 12.5 m², 450,000 Ar
2. **Fissure Avenue de l'Indépendance** - En cours, 35.75 m², 1,500,000 Ar
3. **Affaissement trottoir Place** - Terminé, 8 m², 280,000 Ar
4. **Chaussée défoncée Boulevard** - Nouveau, 45.30 m², 2,000,000 Ar
5. **Pont Route Nationale 5** - En cours, 120 m², 8,500,000 Ar
6. **Piste cyclable Quartier** - Nouveau, 22.5 m², 650,000 Ar

### Photos
Chaque problème a 1-2 photos associées avec le chemin:
`photos/probleme_{id}/image.png`

## Copier les photos dans le dossier storage

Si vous avez des vraies photos, copiez-les dans:
```
laravel-auth-docker/storage/app/public/photos/probleme_1/
laravel-auth-docker/storage/app/public/photos/probleme_2/
... etc
```

Ou utilisez simplement la photo d'exemple fournie (media-literacy-for-all-3-600x399.png) dans tous les dossiers.
