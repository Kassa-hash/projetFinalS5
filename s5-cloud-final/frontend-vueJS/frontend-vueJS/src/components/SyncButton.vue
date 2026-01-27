<template>
  <div class="sync-container">
    <button 
      @click="handleSync"
      :disabled="isLoading"
      class="sync-button"
      :class="{ 'loading': isLoading, 'need-sync': needsSync }"
    >
      <span class="icon">
        <svg v-if="!isLoading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
        <span v-else class="spinner-icon">⟳</span>
      </span>
      <span>{{ buttonText }}</span>
      <span v-if="needsSync && !isLoading" class="badge-sync">{{ signalementsNonSyncs.length }}</span>
    </button>

    <!-- Barre de progression -->
    <div v-if="isLoading && syncProgress.total > 0" class="sync-progress">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <p class="progress-text">
        {{ syncProgress.etape }} ({{ syncProgress.current }}/{{ syncProgress.total }})
      </p>
    </div>

    <!-- Message de résultat -->
    <transition name="fade">
      <div v-if="message" class="sync-message" :class="messageType">
        <div class="message-content">
          <span class="message-icon">{{ messageIcon }}</span>
          <div v-html="message"></div>
        </div>
        <button @click="message = ''" class="close-btn">×</button>
      </div>
    </transition>

    <!-- Statistiques -->
    <div v-if="showStats && syncStats && (syncStats.recus > 0 || syncStats.envoyes > 0)" class="sync-stats">
      <div class="stat">
        <span class="label">📥 Reçus de Firebase:</span>
        <span class="value">{{ syncStats.recus }}</span>
      </div>
      <div class="stat">
        <span class="label">📤 Envoyés vers PostgreSQL:</span>
        <span class="value">{{ syncStats.envoyes }}</span>
      </div>
      <div v-if="syncStats.erreurs && syncStats.erreurs.length > 0" class="stat error">
        <span class="label">❌ Erreurs:</span>
        <span class="value">{{ syncStats.erreurs.length }}</span>
      </div>
    </div>

    <!-- Dernière synchronisation -->
    <div v-if="lastSync" class="last-sync">
      <span class="icon">🕐</span>
      Dernière sync: {{ formatLastSync(lastSync) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSynchronisationStore } from '@/stores/synchronisation'

const props = defineProps({
  showStats: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['syncComplete', 'syncError'])

const syncStore = useSynchronisationStore()
const { 
  isLoading, 
  error, 
  syncStats, 
  lastSync, 
  syncProgress,
  signalementsNonSyncs,
  needsSync
} = storeToRefs(syncStore)

const message = ref('')
const messageType = ref<'success' | 'error' | 'info'>('info')

const buttonText = computed(() => {
  if (isLoading.value) return 'Synchronisation...'
  if (needsSync.value) return 'Synchroniser maintenant'
  return 'Synchroniser'
})

const messageIcon = computed(() => {
  return messageType.value === 'success' ? '✅' : messageType.value === 'error' ? '❌' : 'ℹ️'
})

const progressPercent = computed(() => {
  if (!syncProgress.value.total) return 0
  return Math.round((syncProgress.value.current / syncProgress.value.total) * 100)
})

const handleSync = async () => {
  message.value = ''
  
  try {
    const resultat = await syncStore.synchroniser()
    
    if (resultat.success) {
      messageType.value = 'success'
      message.value = `
        <strong>Synchronisation réussie!</strong><br>
        📥 ${resultat.stats.recus} signalements récupérés de Firebase<br>
        📤 ${resultat.stats.envoyes} signalements envoyés vers PostgreSQL
        ${resultat.stats.erreurs.length > 0 ? `<br>⚠️ ${resultat.stats.erreurs.length} erreur(s)` : ''}
      `
      
      emit('syncComplete', resultat)
    } else {
      messageType.value = 'error'
      message.value = `<strong>Erreur de synchronisation</strong><br>${resultat.erreur}`
      emit('syncError', resultat.erreur)
    }
    
    // Effacer le message après 8 secondes
    setTimeout(() => {
      message.value = ''
    }, 8000)
    
  } catch (err: any) {
    messageType.value = 'error'
    message.value = `<strong>Erreur</strong><br>${err.message}`
    emit('syncError', err.message)
  }
}

const formatLastSync = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  
  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `Il y a ${minutes} min`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  
  return new Date(date).toLocaleString('fr-FR')
}
</script>

<style scoped>
.sync-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sync-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  position: relative;
}

.sync-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.sync-button:active:not(:disabled) {
  transform: translateY(0);
}

.sync-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.sync-button.need-sync {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 4px 20px rgba(255, 193, 7, 0.6); }
}

.sync-button .icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-icon {
  display: inline-block;
  animation: spin 1s linear infinite;
  font-size: 20px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.badge-sync {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(255, 71, 87, 0.5);
}

.sync-progress {
  margin-top: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.progress-text {
  margin-top: 6px;
  font-size: 13px;
  color: #6c757d;
  text-align: center;
}

.sync-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.sync-message.success {
  background-color: #d4edda;
  color: #155724;
  border-left: 4px solid #28a745;
}

.sync-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border-left: 4px solid #dc3545;
}

.message-content {
  display: flex;
  gap: 12px;
  flex: 1;
}

.message-icon {
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  padding: 0 4px;
}

.close-btn:hover {
  opacity: 1;
}

.sync-stats {
  display: flex;
  gap: 1.5rem;
  padding: 14px;
  background-color: #f8f9fa;
  border-radius: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat .label {
  font-size: 13px;
  color: #6c757d;
  font-weight: 500;
}

.stat .value {
  font-size: 20px;
  font-weight: 700;
  color: #212529;
}

.stat.error .value {
  color: #dc3545;
}

.last-sync {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6c757d;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>