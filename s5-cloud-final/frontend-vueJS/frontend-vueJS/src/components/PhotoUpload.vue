<template>
  <div class="photo-upload-container">
    <div class="upload-section">
      <h5>Ajouter des photos</h5>
      
      <div class="upload-area" @dragover.prevent="isDragging = true" @dragleave="isDragging = false" @drop.prevent="handleFileDrop" :class="{ dragging: isDragging }">
        <svg v-if="!uploading" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <div v-else class="spinner"></div>
        <p v-if="!uploading">Glissez vos photos ici ou cliquez pour sélectionner</p>
        <p v-else>Upload en cours...</p>
        <input 
          type="file" 
          ref="fileInput" 
          multiple 
          accept="image/*"
          @change="handleFileSelect"
          style="display: none"
        >
      </div>

      <button @click="fileInput?.click()" :disabled="uploading" class="btn btn-primary">
        {{ uploading ? 'Upload en cours...' : 'Sélectionner photos' }}
      </button>

      <!-- Afficher les photos uploadées -->
      <div v-if="uploadedPhotos.length > 0" class="photos-grid">
        <div v-for="photo in uploadedPhotos" :key="photo.id" class="photo-card">
          <img :src="photo.url" :alt="photo.nom_fichier" class="photo-preview">
          <div class="photo-info">
            <input 
              v-model="photo.description" 
              type="text" 
              placeholder="Description (optionnel)"
              class="description-input"
            >
            <button @click="deletePhoto(photo.id)" class="btn-delete">Supprimer</button>
          </div>
        </div>
      </div>

      <div v-if="uploadError" class="alert alert-danger">
        {{ uploadError }}
      </div>
      <div v-if="uploadSuccess" class="alert alert-success">
        {{ uploadSuccess }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import api from '@/services/api';

interface UploadedPhoto {
  id: number;
  nom_fichier: string;
  url: string;
  description: string;
}

const props = defineProps<{
  id_probleme: number;
}>();

const fileInput = ref<HTMLInputElement | undefined>();
const isDragging = ref(false);
const uploading = ref(false);
const uploadedPhotos = ref<UploadedPhoto[]>([]);
const uploadError = ref('');
const uploadSuccess = ref('');

async function handleFileSelect(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (files) {
    await uploadFiles(Array.from(files));
  }
}

function handleFileDrop(event: DragEvent) {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files) {
    uploadFiles(Array.from(files));
  }
}

async function uploadFiles(files: File[]) {
  uploadError.value = '';
  uploadSuccess.value = '';
  uploading.value = true;

  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('description', '');

      const response = await api.post(
        `/problemes/${props.id_probleme}/photos`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      uploadedPhotos.value.push(response.data.photo);
    }

    uploadSuccess.value = `${files.length} photo(s) uploadée(s) avec succès`;
    setTimeout(() => {
      uploadSuccess.value = '';
    }, 3000);

  } catch (error: any) {
    uploadError.value = error.response?.data?.message || 'Erreur lors de l\'upload';
    console.error('Erreur upload:', error);
  } finally {
    uploading.value = false;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
}

async function deletePhoto(id: number) {
  try {
    await api.delete(`/problemes/photos/${id}`);
    uploadedPhotos.value = uploadedPhotos.value.filter(p => p.id !== id);
    uploadSuccess.value = 'Photo supprimée';
    setTimeout(() => {
      uploadSuccess.value = '';
    }, 2000);
  } catch (error: any) {
    uploadError.value = 'Erreur lors de la suppression';
    console.error('Erreur suppression:', error);
  }
}
</script>

<style scoped>
.photo-upload-container {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.upload-section h5 {
  margin-bottom: 16px;
  font-weight: 600;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-area:hover {
  border-color: #007bff;
  background-color: #f0f8ff;
}

.upload-area.dragging {
  border-color: #007bff;
  background-color: #e7f3ff;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.photo-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.photo-preview {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.photo-info {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.description-input {
  width: 100%;
  padding: 4px;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-delete {
  padding: 4px 8px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-delete:hover {
  background-color: #c82333;
}

.alert {
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 12px;
  font-size: 14px;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}
</style>
