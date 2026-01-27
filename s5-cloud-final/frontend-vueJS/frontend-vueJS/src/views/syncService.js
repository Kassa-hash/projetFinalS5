// syncService.js
import { db } from './firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';

class SyncService {
  
  // 1. RÉCUPÉRER les signalements depuis Firebase
  async recupererSignalements() {
    try {
      console.log('🔄 Récupération des signalements...');
      
      const signalementsRef = collection(db, 'signalements');
      const querySnapshot = await getDocs(signalementsRef);
      
      const signalements = [];
      querySnapshot.forEach((doc) => {
        signalements.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`✅ ${signalements.length} signalements récupérés`);
      return signalements;
      
    } catch (error) {
      console.error('❌ Erreur récupération:', error);
      throw error;
    }
  }
  
  // 2. ENVOYER des données vers Firebase
  async envoyerSignalement(signalementData) {
    try {
      console.log('📤 Envoi du signalement...');
      
      const signalementsRef = collection(db, 'signalements');
      const docRef = await addDoc(signalementsRef, {
        ...signalementData,
        dateCreation: serverTimestamp(),
        synced: true,
        derniereMaj: serverTimestamp()
      });
      
      console.log('✅ Signalement envoyé avec ID:', docRef.id);
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Erreur envoi:', error);
      throw error;
    }
  }
  
  // 3. SYNCHRONISATION COMPLÈTE (récupérer + envoyer)
  async synchroniser(donneesLocales = []) {
    try {
      console.log('🔄 Démarrage de la synchronisation...');
      
      const resultats = {
        recues: 0,
        envoyees: 0,
        erreurs: []
      };
      
      // Étape 1: Récupérer les données en ligne
      const signalementsDistants = await this.recupererSignalements();
      resultats.recues = signalementsDistants.length;
      
      // Étape 2: Envoyer les données locales non synchronisées
      const aEnvoyer = donneesLocales.filter(d => !d.synced);
      
      for (const donnee of aEnvoyer) {
        try {
          await this.envoyerSignalement(donnee);
          resultats.envoyees++;
        } catch (error) {
          resultats.erreurs.push({
            donnee,
            erreur: error.message
          });
        }
      }
      
      console.log('✅ Synchronisation terminée:', resultats);
      return {
        success: true,
        ...resultats,
        signalements: signalementsDistants
      };
      
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      return {
        success: false,
        erreur: error.message
      };
    }
  }
  
  // Mettre à jour un signalement existant
  async mettreAJourSignalement(id, nouvellesdonnees) {
    try {
      const docRef = doc(db, 'signalements', id);
      await updateDoc(docRef, {
        ...nouvellesdonnees,
        derniereMaj: serverTimestamp()
      });
      
      console.log('✅ Signalement mis à jour:', id);
      return true;
      
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      throw error;
    }
  }
}

export default new SyncService();