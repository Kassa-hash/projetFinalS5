# Guide - Gestion des Photos dans Signalements

## Vue d'ensemble

L'application permet maintenant d'ajouter des photos à vos signalements. Les photos sont :
- Capturées via la caméra ou la galerie
- Compressées automatiquement avant upload
- Uploadées vers Firebase Storage
- Affichées dans la liste des signalements

---

## Caractéristiques

### ✨ Fonctionnalités

1. **Capture de photos**
   - Prendre une photo avec la caméra du téléphone
   - Sélectionner une photo existante depuis la galerie
   - Affichage instantané avec preview

2. **Gestion automatique**
   - Compression automatique (max 1200px, qualité 70%)
   - Reduction de taille avant upload
   - Identifiant unique par photo

3. **Stockage Firebase**
   - Les photos sont stockées dans Firebase Storage
   - Organisées par utilisateur : `photos/{uid}/signalement_{timestamp}.jpg`
   - Génération automatique d'URL publique

4. **Affichage**
   - Galerie miniaturisée dans la liste des signalements
   - Clic sur une photo = zoom/détail (optionnel)
   - Max 4-6 photos par signalement (recommandé)

---

## Utilisation

### 1. Ajouter des photos lors de la création d'un signalement

#### Étape par étape :

1. Ouvrir l'app → aller à la carte
2. Appuyer sur **➕** ou long-press sur la carte
3. Remplir le formulaire (titre, description, position, etc.)
4. **Section photos** :
   - Appuyer sur **📷 Prendre une photo** (caméra)
   - OU **🖼️ Galerie** (photos existantes)
   - Répéter pour plusieurs photos

5. Aperçu des photos s'affiche en grille
6. Pour supprimer une photo : appuyer sur le **✕** de la photo
7. Appuyer sur **🔥 Envoyer sur Firebase** (montrera le nombre de photos)

#### Exemple :
```
Titre : "Nid de poule important rue de la Paix"
Description : "Très dangereux pour les motos"
Photos : 3 photos

✕ [Antananarivo] ✕ [Det...] ✕ [Det...]
```

### 2. Afficher les photos dans mes signalements

#### Onglet "📋 Liste" :

- Chaque signalement avec photos affiche une mini-galerie
- Les photos s'affichent en petites vignettes (70x70px)
- Cliquer sur any photo ne fait rien actuellement (possible amélioration)

#### Exemple de card de signalement :
```
🕳️ Nid de poule important [🔴 Nouveau]
    Très dangereux pour les motos
    
    [Photo 1] [Photo 2] [Photo 3]  ← Galerie de vignettes
    
    📍 Rue de la Paix, Tana
    7 février 2026 15:30
```

---

## Configuration requise

### Android Permissions

Les permissions suivantes sont **automatiquement ajoutées** :

```xml
<!-- Dans AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Firebase Storage Rules

Les règles de sécurité pour Firebase Storage doivent autoriser les uploads :

```javascript
// Dans Firebase Console → Storage → Rules

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{user_id}/{allPaths=**} {
      // Autorisé si authentifié ET owner de son dossier
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == user_id;
    }
  }
}
```

### Base de données

Les URLs de photos sont stockées dans Firestore :
- Collection : `signalements`
- Champ : `photoUrls` (array de URLs)
- Champ alternatif : `photos` (array d'objets `{url, chemin}`)

```json
{
  "titre": "Nid de poule",
  "description": "...",
  "photoUrls": [
    "https://firebasestorage.googleapis.com/v0/b/.../photos%2Fuser123%2Fsignalement_1707234000000.jpg",
    "https://firebasestorage.googleapis.com/v0/b/.../photos%2Fuser123%2Fsignalement_1707234005000.jpg"
  ],
  "photos": [
    {"url": "https://...", "chemin": "photos/user123/..."},
    {"url": "https://...", "chemin": "photos/user123/..."}
  ]
}
```

---

## Limite et recommandations

| Aspect | Limite | Recommandation |
|--------|--------|----------------|
| **Taille par photo** | Compression 70% | Auto compressée, max ~100-200 KB |
| **Nombre photos/signalement** | Pas de limite technique | 3-6 photos max (upload rapide) |
| **Formats acceptés** | JPEG, PNG | JPEG auto (meilleur compressé) |
| **Qualité** | Compression 70% | Bon compromis qualité/taille |
| **Résolution max** | 1200x1200px | Auto réduite si trop grande |

---

## Troubleshooting

### Photo ne s'affiche pas

**Causes possibles :**
- Permissions caméra non accordées sur le téléphone
- Espace de stockage insuffisant
- Firebase Storage non configuré

**Solutions :**
```
1. Paramètres → Applications → SignalementApp → Permissions
2. Vérifier "Caméra" est activée
3. Vérifier "Stockage" est activé
4. Redémarrer l'app
```

### Upload prend trop longtemps

**Causes possibles :**
- Connection Internet lente
- Fichier trop volumineux (avant compression)
- Firebase Storage timeout

**Solutions :**
```
1. Attendre la fin du upload (~10-30 sec par photo sur 4G)
2. Vérifier la connexion WiFi
3. Réessayer avec moins de photos
4. Vérifier que Firebase Storage a les permissions d'écriture
```

### Erreur "Utilisateur non authentifié"

**Cause :**
- Pas connecté à Firebase Auth

**Solution :**
```
Se connecter d'abord (email/mot de passe ou Google Sign-In)
```

### Photos ne sont pas sauvegardées après envoi

**Cause probable :**
- Les règles Firebase Storage ne permettent pas l'accès

**Vérifier :**
```
Firebase Console → Storage → Rules
Doit avoir : allow write: if request.auth != null
```

---

## Code implémenté

### Services utilisés

**`src/services/photoService.ts`** :
- `takePhoto()` — Capture caméra
- `pickPhoto()` — Sélection galerie
- `uploadPhotoToFirebase()` — Upload et compression
- `compressImage()` — Compression automatique
- `uploadMultiplePhotos()` — Upload batch

**`src/services/syncService.ts`** :
- `NouveauSignalement` interface — Support photoUrls
- `ajouterSignalement()` — Sauvegarde photos URLs

**`src/pages/AddSignalementPage.tsx`** :
- Boutons "📷 Prendre" / "🖼️ Galerie"
- Galerie preview avec suppression
- Upload batch avant soumission

**`src/pages/MesSignalementsPage.tsx`** :
- Affichage galerie miniaturisée
- Responsive grid layout

---

## Améliorations futures

### Version 1.1 (optionnel)

- [ ] **Zoom sur photo** — Cliquer sur une miniature → fullscreen
- [ ] **Suppression de photo depuis Firestore** — Bouton delete avec confirmation
- [ ] **Édition d'un signalement** — Ajouter/retirer photos après création
- [ ] **Galerie lightbox** — Swipe entre photos en plein écran
- [ ] **Compression côté serveur** — Créer des thumbnails dans Cloud Functions
- [ ] **Géotagging** — Incorporer coordonnées GPS dans les EXIF
- [ ] **OCR** — Détecter automatiquement le texte sur l'image

---

## FAQ

**Q : Combien de photos je peux ajouter ?**  
R : Pas de limite technique, mais recommandé 3-6 max pour rapidité.

**Q : Les photos sont-elles publiques ?**  
R : Non, elles sont dans Firebase Storage en dossier privé par utilisateur. L'URL est temporaire.

**Q : Où sont stockées les photos ?**  
R : Firebase Storage, chemin : `photos/{votre_uid}/signalement_*.jpg`

**Q : Je peux éditer/supprimer une photo après envoi ?**  
R : Pas actuellement (v1.0). À faire en v1.1.

**Q : Ça fonctionne en offline ?**  
R : Capture oui (stockée localement), upload non (needs internet).

---

## Support

- 📖 **Docs Capacitor Camera** : https://capacitorjs.com/docs/apis/camera
- 🔥 **Firebase Storage** : https://firebase.google.com/docs/storage
- 📸 **Compression JS** : Canvas API pour compression JavaScript
- 🎯 **Android Camera** : https://developer.android.com/guide/topics/media/camera

---

**Version** : 1.0  
**Date** : 7 février 2026  
**Status** : Production
