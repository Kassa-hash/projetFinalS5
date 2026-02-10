import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Ajouter le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  register: async (data: {
    name: string
    email: string
    password: string
    password_confirmation: string
    phone?: string
    role: string
  }) => {
    const response = await api.post('/register', {
      name: data.name,
      email: data.email,
      password: data.password,
      password_confirmation: data.password_confirmation,
      phone: data.phone,
      role: data.role
    })
    return response.data
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/login', { email, password })
    return response.data
  },

  logout: async () => {
    await api.post('/logout')
  },

  getUser: async () => {
    const response = await api.get('/user')
    return response.data.user
  }
}

export default authService
