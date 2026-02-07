# 🔧 Guide de Débogage - Mise à Jour du Statut de Problème

## 📊 Architecture de la Mise à Jour

```
1. Frontend Vue.js
   ↓
2. API REST (PUT /api/problemes/{id})
   ↓
3. Backend Laravel
   ├─ Validation
   ├─ Mise à jour PostgreSQL
   └─ (Optionnel) Sync Firebase
```

---

## 🐛 Débogage Étape par Étape

### ÉTAPE 1: Vérifier les Logs Frontend

1. **Ouvrez DevTools** (F12 → Console)
2. **Modifiez un signalement** (changez le statut par ex)
3. **Cliquez sur "Enregistrer"**
4. **Cherchez les logs:**

```javascript
// À chercher dans la console:
📝 [SAVE] Avant validation: { report_id: ..., report_id_probleme: ... }
📤 [SAVE] Envoi au backend: { id: ..., data: { ... } }
🔵 [UPDATE] Envoi des données: { id: ..., cleanData: { ... } }
🟢 [UPDATE] Réponse reçue: 200 (ou erreur)
✅ [SAVE] Succès!
```

**Si vous voyez 🔴 [UPDATE ERROR]:**
- Notez le code d'erreur (404, 422, 500, etc.)
- Notez le message d'erreur
- Continuez à l'ÉTAPE 2

---

### ÉTAPE 2: Vérifier les Logs Backend

1. **SSH dans le conteneur Laravel:**
```bash
docker exec -it app bash
```

2. **Streamer les logs en direct:**
```bash
tail -f storage/logs/laravel.log
```

3. **Faites la mise à jour depuis le frontend**

4. **Cherchez les logs:**
```
[2026-02-06 ...] local.INFO: UPDATE PROBLEME - ID reçu: {"id":5,"request_data":{...}}
[2026-02-06 ...] local.INFO: PROBLEME TROUVÉ: {"id_probleme":5,"current_data":{...}}
[2026-02-06 ...] local.INFO: MISE À JOUR RÉUSSIE: {"new_data":{...}}
```

**Messages d'erreur possibles:**

| Erreur | Cause | Solution |
|--------|-------|----------|
| `PROBLÈME NON TROUVÉ - ID inexistant` | ID incorrect | Vérifier que l'ID existe dans la DB |
| `VALIDATION ÉCHOUÉE` | Données invalides | Vérifier les constrai ntes (date, statut, etc.) |
| `Exception` (500) | Erreur serveur | Vérifier la stack trace complète |

---

### ÉTAPE 3: Tester Directement l'API (sans Frontend)

Pour isoler le problème, testez l'API directement :

**Avec cURL (bash):**
```bash
curl -X PUT http://localhost:8000/api/problemes/5 \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Test UpdateStatus",
    "statut": "en_cours",
    "surface_m2": 10,
    "budget": 500,
    "latitude": -18.8792,
    "longitude": 47.5079,
    "type_probleme": "nid_de_poule",
    "type_route": "route"
  }'
```

**Avec Postman:**
1. Method: `PUT`
2. URL: `http://localhost:8000/api/problemes/5`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "titre": "Test UpdateStatus",
  "statut": "en_cours",
  "surface_m2": 10,
  "budget": 500,
  "latitude": -18.8792,
  "longitude": 47.5079,
  "type_probleme": "nid_de_poule",
  "type_route": "route"
}
```

5. **Vérifiez :**
   - ✅ Status HTTP = 200
   - ✅ Réponse contient `"data"` avec le problème mis à jour
   - ✅ Les champs sont bien changés

---

### ÉTAPE 4: Vérifier la Base de Données PostgreSQL

Si la mise à jour semble fonctionner mais les données disparaissent:

```bash
# SSH dans le conteneur
docker exec -it db bash

# Connecter à PostgreSQL
psql -U laraveluser -d laravel

# Vérifier les données
SELECT id_probleme, titre, statut, date_debut, date_fin FROM probleme_routier WHERE id_probleme = 5;

# Vérifier les timestamps
SELECT id_probleme, titre, statut, updated_at FROM probleme_routier ORDER BY id_probleme DESC LIMIT 5;

# Quitter
\q
```

**À chercher:**
- ✅ Le `statut` a changé
- ✅ Les autres champs (surface, budget, dates, etc.) sont present s
- ✅ Pas d'erreurs de contrainte

---

### ÉTAPE 5: Vérifier la Synchronisation Firebase

Si la mise à jour fonctionne dans PostgreSQL mais pas dans Firebase:

```javascript
// Console Firefox/Chrome
// Vérifier si les données existent dans Firestore
import { db } from '@/firebase/config'
import { doc, getDoc } from 'firebase/firestore'

async function checkFirebase() {
  const docRef = doc(db, 'problemes_routier', 'id-de-doc')
  const snap = await getDoc(docRef)
  console.log('Firebase data:', snap.data())
}

checkFirebase()
```

---

## ✅ Checklist de Débogage Complète

Utilisez cette liste pour isoler le problème :

### Côté Frontend
- [ ] Console montre `📤 [SAVE] Envoi au backend`?
- [ ] L'ID du problème est présent et correct?
- [ ] Les champs obligatoires sont remplis (titre, statut, lat/long)?
- [ ] Pas d'erreur 422 (validation)?

### Réseau HTTP
- [ ] La requête `PUT /api/problemes/{id}` part bien?
- [ ] Status HTTP = 200 ou 201?
- [ ] Réponse JSON contient `"data"`?
- [ ] Pas de CORS error?

### Backend Laravel
- [ ] Logs show `PROBLEME TROUVÉ`?
- [ ] Logs show `MISE À JOUR RÉUSSIE`?
- [ ] Pas d'erreur 404 (problème non trouvé)?
- [ ] Pas d'erreur 422 (validation échouée)?
- [ ] Pas d'exception 500?

### Base de Données
- [ ] PostgreSQL contient les données mises àjour?
- [ ] Les champs sont bien changés?
- [ ] Pas de contrainte de clé étrangère?
- [ ] Les dates sont au bon format?

### Firebase (optionnel)
- [ ] Collection `problemes_routier` existe?
- [ ] Documents contiennent les ID corrects?
- [ ] Synchronisation est-elle configurée?

---

## 🔍 Commandes Utiles

### Vérifier que le conteneur tourne
```bash
docker ps | grep app  # Laravel
docker ps | grep db   # PostgreSQL
```

### Voir les logs Laravel en direct
```bash
docker logs -f app
```

### Accéder à laravel tinker (console interactive)
```bash
docker exec -it app php artisan tinker
> $p = \App\Models\ProblemeRoutier::find(5);
> $p->statut = 'termine';
> $p->save();
> $p->fresh();  # Affiche les données actualisées
```

### Compter les problèmes dans la DB
```bash
docker exec -it app php artisan tinker
> \App\Models\ProblemeRoutier::count();
```

---

## 🎯 Cas Particuliers

### Cas 1: "J'obtiens 404 - Problème non trouvé"
- L'ID que vous envoyez n'existe pas
- Vérifiez que le problème existe: `SELECT id_probleme FROM probleme_routier;`
-Utilisez un ID de la liste

### Cas 2: "J'obtiens 422 - Validation failed"
- Un champ obligatoire manque ou est invalide
- Vérifiez le message d'erreur exacte
- Assurez-vous que:
  - `statut` est `nouveau`, `en_cours` ou `termine`
  - `latitude` est entre -90 et 90
  - `longitude` est entre -180 et 180
  - `type_probleme` est one of: `nid_de_poule`, `fissure`, `affaissement`, `autre`
  - `type_route` est one of: `pont`, `trottoir`, `route`, `piste_cyclable`, `autre`

### Cas 3: "Données mises à jour dans la DB mais pas affichées au frontend"
- Le frontend charge probablement un cache
- Essayez F5 (hard refresh)
- Ou nettoyez le cache: `Application → Storage → Clear site data`

### Cas 4: "Synchronisation Firebase ne fonctionne pas"
- Vérifiez que Firebase est configuré
- Vérifiez les permissions Firestore
- Vérifiez que les données de PostgreSQL sont envoyées à Firebase
- Il faut créer un système de `sync` ou `observer` pour cela

---

## 📝 Template de Rapport de Bug

Si le problème persiste, envoyez les informations suivantes:

```
## Erreur de Mise à Jour

### Étapes pour reproduire:
1. Allez dans [Page/Section]
2. Changez le [Champ]
3. Cliquez sur [Bouton]

### Logshondez Frontend (F12 → Console)
[Collez les logs ici]

### Logs Backend (docker logs)
[Collez les logs ici]

### Réponse API (Network tab)
Status: [...]
Response: [...]

### Base de Données
Avant: [État avant mise à jour]
Après: [État après tentative]

### Version
- Frontend: [VERSION]
- Backend: [VERSION]
- Node: [VERSION]
- PHP: [VERSION]
```

---

**Version:** 1.0  
**Date:** 6 Février 2026
