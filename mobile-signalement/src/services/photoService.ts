// Service de gestion des photos
// Capture/sélection → compression → stockage base64 dans Firestore
// Pas de Firebase Storage (évite les problèmes CORS)

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * Prendre une photo avec la caméra
 */
export async function takePhoto(): Promise<string | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 70,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      width: 800,
      height: 800,
    });
    return image.dataUrl || null;
  } catch (err) {
    console.error('❌ Erreur capture photo :', err);
    return null;
  }
}

/**
 * Sélectionner une photo depuis la galerie
 */
export async function pickPhoto(): Promise<string | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 70,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      width: 800,
      height: 800,
    });
    return image.dataUrl || null;
  } catch (err) {
    console.error('❌ Erreur sélection photo :', err);
    return null;
  }
}

/**
 * Compresser une image base64 via Canvas
 * Optimisé pour envois rapides : réduit à 400px et qualité 0.4 pour rester sous ~50-80KB par image
 */
export function compressImage(base64Data: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Limiter à 400px max pour envoi plus rapide
      const maxSize = 400;
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Data);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.4);

      const sizeKB = Math.round((compressed.length * 3) / 4 / 1024);
      console.log(`🖼️ Photo compressée : ${width}x${height} → ~${sizeKB} KB`);

      resolve(compressed);
    };
    img.onerror = () => resolve(base64Data);
    img.src = base64Data;
  });
}

/**
 * Compression ultra-aggressive si image reste trop grande
 */
function compressImageAggressive(base64Data: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Ultra-compact : 300px max, qualité très basse
      const maxSize = 300;
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Data);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.3);

      const sizeKB = Math.round((compressed.length * 3) / 4 / 1024);
      console.log(`🖼️ Photo ultra-compressée : ${width}x${height} (qualité 0.3) → ~${sizeKB} KB`);

      resolve(compressed);
    };
    img.onerror = () => resolve(base64Data);
    img.src = base64Data;
  });
}

/**
 * Préparer une photo pour stockage dans Firestore (compresser en base64)
 * Retourne la string base64 compressée, prête à être stockée
 */
export async function preparePhotoForFirestore(base64Data: string): Promise<string> {
  const compressed = await compressImage(base64Data);
  
  // Si reste > 150KB, compression ultra-aggressive
  const sizeKB = Math.round((compressed.length * 3) / 4 / 1024);
  if (sizeKB > 150) {
    console.log(`⚠️ Image trop grosse (${sizeKB}KB), compression ultra...`);
    return compressImageAggressive(base64Data);
  }
  
  return compressed;
}

/**
 * Préparer plusieurs photos pour Firestore EN PARALLÈLE (beaucoup plus rapide)
 */
export async function prepareMultiplePhotos(base64List: string[]): Promise<string[]> {
  console.log(`📸 Compression de ${base64List.length} photo(s) en parallèle...`);
  const startTime = performance.now();
  
  // Compresser en parallèle au lieu de séquentiellement
  const results = await Promise.all(
    base64List.map((base64, index) => {
      console.log(`📸 [${index + 1}/${base64List.length}] Compression...`);
      return preparePhotoForFirestore(base64);
    })
  );

  const duration = performance.now() - startTime;
  console.log(`✅ ${results.length} photo(s) prêtes en ${duration.toFixed(1)}ms`);
  return results;
}
