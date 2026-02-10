# Script pour préparer les dossiers et copier les photos d'exemple (Windows)

Write-Host "📁 Création des dossiers de stockage..." -ForegroundColor Cyan

# Créer la structure de dossiers pour le stockage
$folders = @(
    "storage/app/public/photos/probleme_1",
    "storage/app/public/photos/probleme_2",
    "storage/app/public/photos/probleme_3",
    "storage/app/public/photos/probleme_4",
    "storage/app/public/photos/probleme_5",
    "storage/app/public/photos/probleme_6"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
}

Write-Host "✅ Dossiers créés" -ForegroundColor Green

# Copier la photo d'exemple dans chaque dossier
$sourcePhoto = "..\..\frontend-vueJS\frontend-vueJS\photos\media-literacy-for-all-3-600x399.png"

if (Test-Path $sourcePhoto) {
    Write-Host "📸 Copie des photos d'exemple..." -ForegroundColor Cyan
    
    for ($i = 1; $i -le 6; $i++) {
        $destFolder = "storage/app/public/photos/probleme_$i"
        Copy-Item -Path $sourcePhoto -Destination $destFolder -Force
        Write-Host "  ✅ Photo copiée dans $destFolder" -ForegroundColor Green
    }
    
    Write-Host "✅ Photos copiées avec succès" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Photo source non trouvée à $sourcePhoto" -ForegroundColor Yellow
}

Write-Host "✅ Préparation terminée!" -ForegroundColor Green
Write-Host "🎉 Vous pouvez maintenant insérer les données d'exemple" -ForegroundColor Magenta
