# 🔥 Guide - Synchronisation Firebase Implementée

## ✅ Changements Effectués

### 1. **Store Synchronisation** (`src/stores/synchronisation.ts`)
Ajout d'une nouvelle fonction: `mettreAJourFirebase()`

```typescript
// Syntaxe
await mettreAJourFirebase(firebaseId: string, updates: Partial<SignalementFirebase>)

// Fait:
- ✅ Accède à Firestore
- ✅ Cherche le document par firebaseId
- ✅ Met à jour les champs modifiés
- ✅ Ajoute un timestamp "derniere_maj"
- ✅ Logs de succès/erreur
```

### 2. **Manager Service** (`src/services/managerService.ts`)
Modification de `updateProbleme()` avec sync Firebase:

```typescript
// Nouvelle signature
async updateProbleme(
  id: number,                              // ID PostgreSQL
  data: Partial<ProblemeRoutier>,         // Données à mettre à jour
  firebaseId?: string                      // Firebase ID (optionnel)
): Promise<ProblemeRoutier>

// Flux:
1️⃣ Mettre à jour PostgreSQL
2️⃣ Lancer la synchro Firebase (async)
```

### 3. **Dashboard Manager** (`src/views/DashboardManagerView.vue`)
- ✅ Inclus `firebase_id` dans le mapping des données (loadReportsData)
- ✅ Passe le `firebase_id` à updateProbleme()

---

## 🔄 Flux de Synchronisation Complet

```
┌─ Dashboard Frontend ─────────────────────┐
│  Utilisateur change le statut d'un       │
│  signalement et clique "Enregistrer"     │
└──────────────┬──────────────────────────┘
               │
               ▼
        saveReport()
               │
               ├─ Valide les données locales
               │
               ▼
    Firebase_id = report.firebase_id
               │
               ▼
      await updateProbleme(
        id: id_probleme,      ← PostgreSQL ID
        data: {...},
        firebaseId: firebase_id  ← Firebase ID
      )
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
   PostgreSQL    Firebase
   
   PUT /api/      asyncMettreAJourFirebase()
   problemes/{id}    │
        │            ├─ updateDoc()
        ▼            ├─ serverTimestamp()
   ✅ Données       ├─ Logs détaillés
      mises à jour  ▼
                 ✅ Document mis à jour
```

---

## 🧪 Comment Tester

### Test 1: Vérifier les Logs Frontend

1. **Ouvrez DevTools** (F12 → Console)
2. **Modifiez un signalement** (changez le statut par ex.)
3. **Cliquez "Enregistrer"**
4. **Cherchez les logs:**

```
📤 [SAVE] Envoi au backend: { id, firebaseId, data }
🔵 [UPDATE] Envoi des données: { id, cleanData }
🟢 [UPDATE] Réponse reçue: 200 {...data}
🔄 [SYNC] Synchronisation vers Firebase en arrière-plan...
✅ [SYNC] Synchronisation Firebase réussie!
✅ [SAVE] Succès!
```

**Cas d'erreur (mais PostgreSQL est OK):**
```
⚠️ [SYNC] Erreur synchronisation Firebase: ...
(Cela ne bloque pas car PostgreSQL a déjà été mis à jour)
```

---

### Test 2: Vérifier Firebase Firestore

1. **Allez sur [Firebase Console](https://console.firebase.google.com/)**
2. **Projet → Firestore Database**
3. **Collection `signalements`** → Cherchez un document
4. **Cliquez sur le document**
5. **Cherchez le champ `statut`** → Doit avoir la nouvelle valeur
6. **Vérifiez `derniere_maj`** → Doit avoir un timestamp récent

---

### Test 3: Vérifier PostgreSQL

1. **SSH dans le conteneur:**
```bash
docker exec -it db psql -U laraveluser -d laravel
```

2. **Requête:**
```sql
SELECT id_probleme, titre, statut, firebase_id 
FROM probleme_routier 
WHERE firebase_id IS NOT NULL 
ORDER BY id_probleme DESC LIMIT 5;
```

3. **Vérifier:**
- ✅ `statut` a changé
- ✅ `firebase_id` est présent et non NULL
- ❌ Si `firebase_id` est NULL → Pas de synchronisation possible

---

## 📊 États Possibles

### ✅ Cas Idéal
```
Console Frontend          PostgreSQL             Firebase Firestore
───────────────         ──────────              ───────────────
✅ SYNC réussi          ✅ statut='en_cours'    ✅ statut='en_cours'
                        ✅ firebase_id=xxx      ✅ firebase_id=xxx
```

### ⚠️ PostgreSQL OK, Firebase Échoue (Acceptable)
```
Console Frontend              PostgreSQL             Firebase Firestore
───────────────────         ──────────────          ──────────────────
✅ SYNC échoue (async)       ✅ statut='en_cours'    ❌ inchangé
⚠️ Erreur pas bloquante      ✅ firebase_id=xxx        (mais on peut retry)
```

### ❌ Cas Problématique
```
Console Frontend          PostgreSQL             Firebase Firestore
───────────────         ──────────              ───────────────
❌ Erreur UPDATE         ❌ inchangé             ❌ inchangé
🚨 Rien n'a changé  
```

---

## 🐛 Troubleshooting

### "Je ne vois pas de logs `[SYNC]`"
**Causes:**
- Le problème n'a pas de `firebase_id`
- Les logs sont au-dessus dans la console
- Firebase n'est pas configuré

**Solution:**
1. Vérifiez dans PostgreSQL:
```bash
SELECT firebase_id FROM probleme_routier WHERE id_probleme = 5;
```

2. Si NULL → Il n'y a pas de synchronisation possible
3. Créer un signalement depuis l'app mobile ou sync en attente

### "Firebase reçoit un message d'erreur"
**Log à chercher:**
```
⚠️ [SYNC] Erreur synchronisation Firebase: Permission denied
```

**Cause:** Permissions Firestore insuffisantes

**Solution:** Vérifier les règles Firestore dans la console Firebase

### "PostgreSQL mis à jour mais pas Firebase"
C'est OK! La synchronisation est asynchrone et non-bloquante.
- PostgreSQL: ✅ Toujours réussi (sinon erreur dès le début)
- Firebase: ⚠️ Peut échouer mais ne bloque pas l'app

---

## 📋 Architecture Complète

```
Frontend (Vue.js)
├─ DashboardManagerView.vue
│  ├─ loadReportsData() → récupère firebase_id
│  └─ saveReport() → appelle updateProbleme()
│
├─ managerService
│  └─ updateProbleme(id, data, firebaseId)
│     ├─ 1. PUT /api/problemes/{id} → PostgreSQL ✅
│     └─ 2. syncStore.mettreAJourFirebase() → Firebase (async)
│
└─ synchronisation.ts (Pinia Store)
   └─ mettreAJourFirebase(firebaseId, updates)
      └─ updateDoc() → Firestore

Backend (Laravel)
└─ ProblemeRoutierController.update()
   └─ return probleme avec firebase_id
```

---

## ✨ Améliorations Futures

1. **Retry automatique après erreur Firebase**
   - Queue de synchronisation persistante
   - Service Sync qui essaie périodiquement

2. **Bidirectionnelle (Firebase → PostgreSQL)**
   - Listener Firebase
   - Sync inverse sur changement Firebase

3. **Conflict Resolution**
   - Si données changent des deux côtés
   - Utiliser `derniere_maj` comme repère

4. **Dashboard de Sync**
   - Montrer l'état de synchronisation
   - Nombre de docs à synchroniser
   - Erreurs rencontrées

---

## 🆘 Besoin d'Aide?

Si la synchronisation ne fonctionne pas:

1. **Collectez les logs frontend** (F12)
2. **Vérifiez firebase_id en PostgreSQL**
3. **Vérifiez les règles Firestore**
4. **Comparez les timestamps** (derniere_maj)

---

**Version:** 1.0  
**Date:** 6 Février 2026  
**Status:** ✅ Implémenté et Testé
