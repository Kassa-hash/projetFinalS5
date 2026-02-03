<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo -->
      <div class="login-logo">
        <div class="logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <div class="logo-text">
          <span class="logo-name">RouteFix</span>
          <span class="logo-subtitle">Gestionnaire</span>
        </div>
      </div>

      <h1>Connexion</h1>
      <p class="login-subtitle">Accédez à votre espace de gestion</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Email
          </label>
          <input
            v-model="email"
            type="email"
            id="email"
            placeholder="votre@email.com"
            required
            @focus="authStore.clearError()"
          />
        </div>

        <div class="form-group">
          <label for="password">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Mot de passe
          </label>
          <input
            v-model="password"
            type="password"
            id="password"
            placeholder="••••••••"
            required
            @focus="authStore.clearError()"
          />
        </div>

        <button type="submit" :disabled="authStore.loading" class="btn-submit">
          <span v-if="authStore.loading" class="btn-loading">
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            Connexion...
          </span>
          <span v-else class="btn-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Se connecter
          </span>
        </button>

        <div v-if="authStore.error" class="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {{ authStore.error }}
        </div>
      </form>

      <div class="form-footer">
        <p>Pas encore de compte ? <router-link to="/register">S'inscrire</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    const response = await authStore.login(email.value, password.value)
    
    console.log('Login response:', response)
    console.log('Auth store user:', authStore.user)
    console.log('Auth store isAuthenticated:', authStore.isAuthenticated)
    
    // Attendre que user soit défini dans le store
    if (response?.user) {
      console.log('User role:', response.user.role)
      // Redirection selon le rôle reçu
      if (response.user.role === 'manager') {
        console.log('Redirecting to manager dashboard')
        router.push('/dashboard/manager')
      } else if (response.user.role === 'user') {
        console.log('Redirecting to user dashboard')
        router.push('/dashboard/user')
      } else {
        console.warn('No valid role found:', response.user.role)
      }
    } else {
      console.error('No user in response:', response)
    }
  } catch (err: any) {
    console.error('Login error:', err.message || err)
    // Erreur affichée dans le template
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
  width: 100%;
  padding: 2rem;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  margin: 0;
  box-sizing: border-box;
}

.login-card {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 450px;
  min-width: 280px;
  margin: 0 auto;
}

.login-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.logo-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e3a5f;
}

.logo-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
}

h1 {
  text-align: center;
  color: #1e3a5f;
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 700;
}

.login-subtitle {
  text-align: center;
  color: #6b7280;
  margin: 0 0 2rem 0;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
}

label svg {
  color: #6b7280;
}

input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s;
  box-sizing: border-box;
  background: #f9fafb;
}

input:focus {
  outline: none;
  border-color: #1e3a5f;
  background: white;
  box-shadow: 0 0 0 4px rgba(30, 58, 95, 0.1);
}

input::placeholder {
  color: #9ca3af;
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(30, 58, 95, 0.3);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-content, .btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem;
  border-radius: 10px;
  margin-top: 1rem;
  border-left: 4px solid #dc2626;
  font-size: 0.9rem;
}

.form-footer {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
}

.form-footer a {
  color: #1e3a5f;
  text-decoration: none;
  font-weight: 600;
}

.form-footer a:hover {
  color: #f59e0b;
}

/* Media Queries */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
    width: 95%;
  }

  h1 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem 1rem;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
  }

  .logo-name {
    font-size: 1.25rem;
  }

  h1 {
    font-size: 1.25rem;
  }

  input {
    padding: 0.75rem;
    font-size: 0.9rem;
  }

  .btn-submit {
    padding: 0.875rem;
    font-size: 0.9rem;
  }
}
</style>
