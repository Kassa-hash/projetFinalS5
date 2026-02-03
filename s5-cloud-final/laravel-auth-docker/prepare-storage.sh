#!/bin/bash
# Script pour préparer les dossiers et copier les photos d'exemple

echo "📁 Création des dossiers de stockage..."

# Créer la structure de dossiers pour le stockage
mkdir -p storage/app/public/photos/probleme_1
mkdir -p storage/app/public/photos/probleme_2
mkdir -p storage/app/public/photos/probleme_3
mkdir -p storage/app/public/photos/probleme_4
mkdir -p storage/app/public/photos/probleme_5
mkdir -p storage/app/public/photos/probleme_6

echo "✅ Dossiers créés"

# Copier la photo d'exemple dans chaque dossier
if [ -f "../frontend-vueJS/frontend-vueJS/photos/media-literacy-for-all-3-600x399.png" ]; then
    echo "📸 Copie des photos d'exemple..."
    
    cp "../frontend-vueJS/frontend-vueJS/photos/media-literacy-for-all-3-600x399.png" storage/app/public/photos/probleme_1/
    cp "../frontend-vueJS/frontend-vueJS/photos/media-literacy-for-all-3-600x399.png" storage/app/public/photos/probleme_2/
    cp "../frontend-vueJS/frontend-vueJS/photos/media-literacy-for-all-3-600x399.png" storage/app/public/photos/probleme_3/
    cp "../frontend-vueJS/frontend-vueJS/photos/media-literacy-for-all-3-600x399.png" storage/app/public/photos/probleme_4/
    cp "../frontend-vueJS/frontend-vueJS/photos/media-literacy-for-all-3-600x399.png" storage/app/public/photos/probleme_5/
    cp "../frontend-vueJS/frontend-vueJS/photos/media-literacy-for-all-3-600x399.png" storage/app/public/photos/probleme_6/
    
    echo "✅ Photos copiées avec succès"
else
    echo "⚠️  Photo source non trouvée à ../frontend-vueJS/frontend-vueJS/photos/"
fi

# Définir les permissions
chmod -R 755 storage/app/public/photos

echo "✅ Permissions définies"
echo "🎉 Préparation terminée!"
