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

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const userRole = computed(() => user.value?.role ?? 'visitor')
  const isManager = computed(() => userRole.value === 'manager')
  const isUser = computed(() => userRole.value === 'user')

  const register = async (data: any) => {
    loading.value = true
    error.value = null
    try {
      const response = await authService.register(data)
      token.value = response.token
      user.value = response.user
      localStorage.setItem('token', response.token)
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
        localStorage.setItem('token', response.id_token)
      }
      
      user.value = response.user
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
      localStorage.removeItem('token')
    }
  }

  const fetchUser = async () => {
    if (!token.value) return
    try {
      user.value = await authService.getUser()
    } catch (err) {
      token.value = null
      localStorage.removeItem('token')
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
    isAuthenticated,
    userRole,
    isManager,
    isUser,
    register,
    login,
    logout,
    fetchUser,
    clearError
  }
})
