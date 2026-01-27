// src/firebase/config.js
import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// Configuration Firebase depuis les variables d'environnement
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// 🔍 Vérification de la configuration (aide au debug)
console.log('🔥 Firebase Configuration Check:')
console.log('  ✓ API Key:', firebaseConfig.apiKey ? '✅ Présent' : '❌ MANQUANT')
console.log('  ✓ Auth Domain:', firebaseConfig.authDomain ? '✅ Présent' : '❌ MANQUANT')
console.log('  ✓ Project ID:', firebaseConfig.projectId || '❌ MANQUANT')
console.log('  ✓ Storage Bucket:', firebaseConfig.storageBucket ? '✅ Présent' : '❌ MANQUANT')
console.log('  ✓ Messaging Sender ID:', firebaseConfig.messagingSenderId ? '✅ Présent' : '❌ MANQUANT')
console.log('  ✓ App ID:', firebaseConfig.appId ? '✅ Présent' : '❌ MANQUANT')

// Vérifier si toutes les variables sont chargées
const missingVars = []
if (!firebaseConfig.apiKey) missingVars.push('VITE_FIREBASE_API_KEY')
if (!firebaseConfig.authDomain) missingVars.push('VITE_FIREBASE_AUTH_DOMAIN')
if (!firebaseConfig.projectId) missingVars.push('VITE_FIREBASE_PROJECT_ID')
if (!firebaseConfig.storageBucket) missingVars.push('VITE_FIREBASE_STORAGE_BUCKET')
if (!firebaseConfig.messagingSenderId) missingVars.push('VITE_FIREBASE_MESSAGING_SENDER_ID')
if (!firebaseConfig.appId) missingVars.push('VITE_FIREBASE_APP_ID')

if (missingVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:', missingVars)
  console.error('⚠️ Assurez-vous que le serveur Vite a été redémarré après modification du .env')
  throw new Error(`Variables Firebase manquantes: ${missingVars.join(', ')}`)
}

// Initialiser Firebase
let app
try {
  app = initializeApp(firebaseConfig)
  console.log('✅ Firebase initialisé avec succès')
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation de Firebase:', error)
  throw error
}

// Initialiser Firestore
let db
try {
  db = getFirestore(app)
  console.log('✅ Firestore initialisé avec succès')
  
  // Optionnel: Utiliser l'émulateur Firestore en développement
  // Décommentez ces lignes si vous utilisez l'émulateur Firebase
  // if (import.meta.env.DEV) {
  //   connectFirestoreEmulator(db, 'localhost', 8080)
  //   console.log('🔧 Firestore Emulator connecté')
  // }
  
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation de Firestore:', error)
  throw error
}

// Exporter la base de données
export { db, app }