import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'

interface User {
  id: number
  name: string
  email: string
  role: string
  phone?: string
  account_lockout: boolean
}

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  SESSION_TIME: 'auth_session_time'
}

export const useAuthStore = defineStore('auth', () => {
  // Restaurer depuis localStorage
  const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
  const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN)
  
  const user = ref<User | null>(storedUser ? JSON.parse(storedUser) : null)
  const token = ref<string | null>(storedToken)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sessionRestored = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role ?? 'visitor')
  const isManager = computed(() => userRole.value === 'manager')
  const isUser = computed(() => userRole.value === 'user')

  const register = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await authService.register(data)
      
      // Gérer les deux types de réponses (Firebase et Postgres)
      if (response.id_token) {
        token.value = response.id_token
        localStorage.setItem(STORAGE_KEYS.TOKEN, response.id_token)
      } else if (response.token) {
        token.value = response.token
        localStorage.setItem(STORAGE_KEYS.TOKEN, response.token)
      }
      
      user.value = useAuthStore().user
      localStorage.setItem(STORAGE_KEYS.SESSION_TIME, Date.now().toString())
      
      // Si pas de token (fallback Postgres sans token), faire un login automatique
      if (!token.value && response.source === 'postgres') {
        await login(data.email, data.password)
      }
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'inscription'
      throw err
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await authService.login(email, password)
      
      // Gérer les deux types de réponses (Firebase et Postgres)
      if (response.id_token) {
        token.value = response.id_token
        localStorage.setItem(STORAGE_KEYS.TOKEN, response.id_token)
      } else if (response.token) {
        token.value = response.token
        localStorage.setItem(STORAGE_KEYS.TOKEN, response.token)
      }
      
      user.value = response.user
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user))
      localStorage.setItem(STORAGE_KEYS.SESSION_TIME, Date.now().toString())
      
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Email ou mot de passe incorrect'
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      localStorage.removeItem(STORAGE_KEYS.SESSION_TIME)
    }
  }

  const fetchUser = async () => {
    if (!token.value) return
    try {
      user.value = await authService.getUser()
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user.value))
      localStorage.setItem(STORAGE_KEYS.SESSION_TIME, Date.now().toString())
    } catch (err: any) {
      // Erreur 401 = token invalide ou session expirée
      if (err.response?.status === 401) {
        token.value = null
        user.value = null
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        localStorage.removeItem(STORAGE_KEYS.USER)
        localStorage.removeItem(STORAGE_KEYS.SESSION_TIME)
      }
      throw err
    }
  }

  const restoreSession = async () => {
    if (!token.value) {
      sessionRestored.value = true
      return false
    }

    try {
      await fetchUser()
      sessionRestored.value = true
      console.log('✅ Session restaurée')
      return true
    } catch (err) {
      console.log('❌ Session expirée ou invalide')
      sessionRestored.value = true
      return false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    user,
    token,
    loading,
    error,
    sessionRestored,
    isAuthenticated,
    userRole,
    isManager,
    isUser,
    register,
    login,
    logout,
    fetchUser,
    restoreSession,
    clearError
  }
})
