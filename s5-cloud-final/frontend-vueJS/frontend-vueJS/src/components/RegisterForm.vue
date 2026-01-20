<template>
  <div class="register-container">
    <div class="register-form">
      <h1>Inscription</h1>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Nom complet</label>
          <input
            v-model="formData.name"
            type="text"
            id="name"
            placeholder="Jean Dupont"
            required
            @focus="authStore.clearError()"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            v-model="formData.email"
            type="email"
            id="email"
            placeholder="votre@email.com"
            required
            @focus="authStore.clearError()"
          />
        </div>

        <div class="form-group">
          <label for="phone">Téléphone (optionnel)</label>
          <input
            v-model="formData.phone"
            type="tel"
            id="phone"
            placeholder="+33 6 00 00 00 00"
          />
        </div>

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input
            v-model="formData.password"
            type="password"
            id="password"
            placeholder="••••••••"
            required
            @focus="authStore.clearError()"
          />
        </div>

        <div class="form-group">
          <label for="password_confirmation">Confirmer le mot de passe</label>
          <input
            v-model="formData.password_confirmation"
            type="password"
            id="password_confirmation"
            placeholder="••••••••"
            required
            @focus="authStore.clearError()"
          />
        </div>

        <button type="submit" :disabled="authStore.loading" class="btn-submit">
          {{ authStore.loading ? 'Inscription en cours...' : 'S\'inscrire' }}
        </button>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>
      </form>

      <div class="form-footer">
        <p>Vous avez déjà un compte ? <router-link to="/login">Se connecter</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const formData = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
  role: 'user'
})

const handleRegister = async () => {
  if (formData.password !== formData.password_confirmation) {
    authStore.error = 'Les mots de passe ne correspondent pas'
    return
  }

  try {
    await authStore.register(formData)
    if (authStore.isManager) {
      router.push('/dashboard/manager')
    } else if (authStore.isUser) {
      router.push('/dashboard/user')
    }
  } catch (err) {
    // Erreur affichée dans le template
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  margin: 0;
  box-sizing: border-box;
}

.register-form {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
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

input, select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

input:focus, select:focus {
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
  .register-container {
    padding: 1rem;
  }

  .register-form {
    padding: 30px 20px;
    width: 95%;
  }

  h1 {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .register-form {
    padding: 20px 15px;
  }

  h1 {
    font-size: 20px;
  }

  input, select {
    padding: 10px;
    font-size: 14px;
  }

  .btn-submit {
    padding: 10px;
    font-size: 14px;
  }
}
</style>
