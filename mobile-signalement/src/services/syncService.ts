// Service de synchronisation Firestore
// Lit les signalements depuis la collection Firebase 'signalements'
// avec fallback vers l'API PostgreSQL (même logique que l'app VueJS)
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { auth } from '../firebase/config';
import api from './api';
import type { Probleme } from '../types';

/**
 * Récupérer les signalements depuis Firestore
 */
export async function fetchSignalementsFirebase(): Promise<Probleme[]> {
  console.log('🔥 Récupération depuis Firebase Firestore...');
  const signalementsRef = collection(db, 'signalements');
  const q = query(signalementsRef, orderBy('date_signalement', 'desc'));
  const querySnapshot = await getDocs(q);

  const signalements: Probleme[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const photoUrls = data.photoUrls || data.photos || [];
    signalements.push({
      firebase_id: doc.id,
      titre: data.titre || 'Sans titre',
      description: data.description || '',
      type_probleme: normalizeTypeProbleme(data.type_probleme),
      type_route: normalizeTypeRoute(data.type_route),
      statut: normalizeStatut(data.statut),
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
      adresse: data.adresse || '',
      date_signalement: convertDate(data.date_signalement),
      date_resolution: data.date_fin ? convertDate(data.date_fin) : undefined,
      photoUrls: Array.isArray(photoUrls) ? photoUrls : [],
    });
  });

  console.log(`✅ ${signalements.length} signalements récupérés depuis Firebase`);
  return signalements;
}

/**
 * Récupérer les signalements depuis l'API PostgreSQL (fallback)
 */
export async function fetchSignalementsPostgres(): Promise<Probleme[]> {
  console.log('🗄️ Récupération depuis PostgreSQL...');
  const response = await api.get('/problemes');
  const data = response.data.data || response.data;
  console.log(`✅ ${data.length} signalements récupérés depuis PostgreSQL`);
  return data;
}

/**
 * Récupérer les signalements avec fallback automatique :
 * 1. Si authentifié → essayer Firebase d'abord
 * 2. Sinon ou en cas d'erreur → fallback PostgreSQL
 * 3. Si tout échoue → données locales (localStorage)
 */
export async function recupererSignalements(): Promise<{
  data: Probleme[];
  source: 'firebase' | 'postgres' | 'local';
}> {
  // Essayer Firebase si l'utilisateur est authentifié
  if (auth.currentUser) {
    try {
      const data = await fetchSignalementsFirebase();
      // Sauvegarder en cache local pour le mode offline
      localStorage.setItem('signalements_cache', JSON.stringify(data));
      return { data, source: 'firebase' };
    } catch (err) {
      console.warn('⚠️ Firebase échoué, fallback sur PostgreSQL...', err);
    }
  }

  // Fallback PostgreSQL
  try {
    const data = await fetchSignalementsPostgres();
    localStorage.setItem('signalements_cache', JSON.stringify(data));
    return { data, source: 'postgres' };
  } catch (err) {
    console.warn('⚠️ PostgreSQL échoué, utilisation du cache local...', err);
  }

  // Dernier recours : cache local
  const cached = localStorage.getItem('signalements_cache');
  if (cached) {
    return { data: JSON.parse(cached), source: 'local' };
  }

  return { data: [], source: 'local' };
}

// ===== Helpers =====

function convertDate(date: unknown): string {
  if (!date) return new Date().toISOString();
  if (date instanceof Timestamp) return date.toDate().toISOString();
  if (date instanceof Date) return date.toISOString();
  if (typeof date === 'string') return date;
  // Firebase Timestamp-like object { seconds, nanoseconds }
  if (typeof date === 'object' && date !== null && 'seconds' in date) {
    return new Date((date as { seconds: number }).seconds * 1000).toISOString();
  }
  return new Date().toISOString();
}

function normalizeStatut(val: unknown): Probleme['statut'] {
  const s = String(val || '').trim().toLowerCase();
  if (s === 'en_cours' || s === 'en cours') return 'en_cours';
  if (s === 'termine' || s === 'terminé' || s === 'résolu') return 'termine';
  return 'nouveau';
}

function normalizeTypeProbleme(val: unknown): Probleme['type_probleme'] {
  const s = String(val || '').trim().toLowerCase();
  if (s.includes('fissure')) return 'fissure';
  if (s.includes('affaissement')) return 'affaissement';
  if (s.includes('nid') || s.includes('poule')) return 'nid_de_poule';
  return 'autre';
}

function normalizeTypeRoute(val: unknown): Probleme['type_route'] {
  const s = String(val || '').trim().toLowerCase();
  if (s.includes('pont')) return 'pont';
  if (s.includes('trottoir')) return 'trottoir';
  if (s.includes('piste') || s.includes('cyclable')) return 'piste_cyclable';
  if (s.includes('route')) return 'route';
  return 'autre';
}

// ===== Écriture =====

export interface NouveauSignalement {
  titre: string;
  description: string;
  type_probleme: Probleme['type_probleme'];
  type_route: Probleme['type_route'];
  latitude: number;
  longitude: number;
  adresse?: string;
  surface_m2?: number;
  budget?: number;
  entreprise?: string;
  photoUrls?: string[];
}

/**
 * Ajouter un signalement directement dans Firebase Firestore
 */
export async function ajouterSignalement(
  data: NouveauSignalement
): Promise<string> {
  const signalementsRef = collection(db, 'signalements');
  const docRef = await addDoc(signalementsRef, {
    titre: data.titre,
    description: data.description,
    type_probleme: data.type_probleme,
    type_route: data.type_route,
    statut: 'nouveau',
    latitude: data.latitude,
    longitude: data.longitude,
    adresse: data.adresse || '',
    surface_m2: data.surface_m2 || 0,
    budget: data.budget || 0,
    entreprise: data.entreprise || '',
    photos: data.photoUrls || [],
    photoUrls: data.photoUrls || [],
    date_signalement: serverTimestamp(),
    derniere_maj: serverTimestamp(),
    synced: false,
    user_email: auth.currentUser?.email || '',
    user_uid: auth.currentUser?.uid || '',
  });
  console.log('✅ Signalement ajouté dans Firebase:', docRef.id);
  return docRef.id;
}

// ===== Mes signalements =====

/**
 * Récupérer uniquement les signalements de l'utilisateur connecté
 */
export async function fetchMesSignalements(): Promise<Probleme[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Non authentifié');

  const signalementsRef = collection(db, 'signalements');
  const q = query(
    signalementsRef,
    where('user_uid', '==', uid)
  );
  const snap = await getDocs(q);

  const result: Probleme[] = [];
  snap.forEach((doc) => {
    const d = doc.data();
    result.push({
      firebase_id: doc.id,
      titre: d.titre || 'Sans titre',
      description: d.description || '',
      type_probleme: normalizeTypeProbleme(d.type_probleme),
      type_route: normalizeTypeRoute(d.type_route),
      statut: normalizeStatut(d.statut),
      latitude: Number(d.latitude) || 0,
      longitude: Number(d.longitude) || 0,
      adresse: d.adresse || '',
      date_signalement: convertDate(d.date_signalement),
      date_resolution: d.date_fin ? convertDate(d.date_fin) : undefined,
    });
  });

  // Tri côté client (évite de nécessiter un index composite Firestore)
  result.sort((a, b) => new Date(b.date_signalement).getTime() - new Date(a.date_signalement).getTime());
  return result;
}

// ===== Écouteur temps réel pour les changements de statut =====

export interface StatutChange {
  id: string;
  titre: string;
  ancienStatut: Probleme['statut'];
  nouveauStatut: Probleme['statut'];
  timestamp: number;
}

/**
 * Écoute en temps réel les signalements de l'utilisateur.
 * Quand un statut change, appelle le callback.
 */
export function ecouterMesSignalements(
  onStatutChange: (change: StatutChange) => void
): Unsubscribe {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};

  const signalementsRef = collection(db, 'signalements');
  const q = query(signalementsRef, where('user_uid', '==', uid));

  // Snapshot local des statuts pour détecter les changements
  const statutsConnus = new Map<string, Probleme['statut']>();
  let premierChargement = true;

  return onSnapshot(q, (snapshot) => {
    if (premierChargement) {
      // Au premier chargement on initialise les statuts connus sans notifier
      snapshot.docs.forEach((doc) => {
        statutsConnus.set(doc.id, normalizeStatut(doc.data().statut));
      });
      premierChargement = false;
      return;
    }

    snapshot.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        const doc = change.doc;
        const data = doc.data();
        const nouveauStatut = normalizeStatut(data.statut);
        const ancienStatut = statutsConnus.get(doc.id);

        if (ancienStatut && ancienStatut !== nouveauStatut) {
          onStatutChange({
            id: doc.id,
            titre: data.titre || 'Signalement',
            ancienStatut,
            nouveauStatut,
            timestamp: Date.now(),
          });
        }
        statutsConnus.set(doc.id, nouveauStatut);
      } else if (change.type === 'added') {
        statutsConnus.set(change.doc.id, normalizeStatut(change.doc.data().statut));
      } else if (change.type === 'removed') {
        statutsConnus.delete(change.doc.id);
      }
    });
  });
}
