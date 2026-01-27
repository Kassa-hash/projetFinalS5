<template>
  <div class="login-container">
    <div class="login-form">
      <h1>Connexion</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
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
          <label for="password">Mot de passe</label>
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
          {{ authStore.loading ? 'Connexion en cours...' : 'Se connecter' }}
        </button>

        <div v-if="authStore.error" class="error-message">
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
  min-height: calc(100vh - 60px);
  width: 100%;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  box-sizing: border-box;
}

.login-form {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 500px;
  min-width: 280px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 10px;
}

.btn-submit:hover:not(:disabled) {
  background: #5568d3;
}

.btn-submit:disabled {
  background: #999;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 5px;
  margin-top: 15px;
  border-left: 4px solid #c33;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.form-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.form-footer a:hover {
  text-decoration: underline;
}

/* Media Queries */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }

  .login-form {
    padding: 30px 20px;
    width: 95%;
  }

  h1 {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .login-form {
    padding: 20px 15px;
  }

  h1 {
    font-size: 20px;
  }

  input {
    padding: 10px;
    font-size: 14px;
  }

  .btn-submit {
    padding: 10px;
    font-size: 14px;
  }
}
</style>
