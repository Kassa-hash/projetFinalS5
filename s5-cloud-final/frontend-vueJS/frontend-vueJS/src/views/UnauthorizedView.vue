<template>
  <div class="unauthorized-container">
    <div class="error-card">
      <div class="error-icon">🚫</div>
      <h1>Accès Refusé</h1>
      <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      
      <div class="error-details">
        <p><strong>Votre rôle:</strong> {{ authStore.userRole }}</p>
        <p><strong>Rôle requis:</strong> Manager</p>
      </div>

      <div class="action-buttons">
        <router-link to="/" class="btn btn-primary">
          Retour à l'accueil
        </router-link>
        <router-link :to="'/dashboard/' + authStore.userRole" class="btn btn-secondary">
          Mon Dashboard
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
</script>

<style scoped>
.unauthorized-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 2rem;
}

.error-card {
  background: white;
  padding: 3rem;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-card h1 {
  color: #c33;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-card p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.error-details {
  background: #fee;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1.5rem 0;
  border-left: 4px solid #c33;
}

.error-details p {
  color: #333;
  margin: 0.5rem 0;
  font-size: 1rem;
}

.error-details strong {
  color: #c33;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.btn {
  padding: 10px 20px;
  border-radius: 5px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
  display: inline-block;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #667eea;
  color: white;
}
</style>
