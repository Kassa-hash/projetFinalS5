import apiClient from './api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export interface User {
  id: number
  name: string
  email: string
  role: string
  phone?: string
  account_lockout: boolean
  login_attempts?: number
  locked_until?: string | null
  firebase_uid?: string
}

export interface ProblemeRoutier {
  id_probleme: number
  titre: string
  description: string
  statut: 'nouveau' | 'en_cours' | 'termine'
  date_signalement: string
  date_debut?: string | null
  date_fin?: string | null
  surface_m2: number
  budget: number
  entreprise?: string | null
  latitude: number
  longitude: number
  type_probleme: string
  type_route: string
  firebase_id?: string | null
}

export interface DashboardStats {
  nb_points: number
  surface_totale: number
  budget_total: number
  avancement_pourcent: number
}

export interface UserStats {
  total: number
  managers: number
  locked: number
  active: number
}

export const managerService = {
  // Gestion des utilisateurs
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get(`${API_URL}/users`)
      return response.data
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  async getLockedUsers(): Promise<User[]> {
    try {
      // Si pas d'endpoint spécifique, filtrer côté frontend
      const response = await apiClient.get(`${API_URL}/users`)
      return response.data.filter((user: User) => user.account_lockout)
    } catch (error) {
      console.error('Error fetching locked users:', error)
      throw error
    }
  },

  async unlockUser(email: string): Promise<any> {
    try {
      const response = await apiClient.post(`${API_URL}/unlock-account`, { email })
      return response.data
    } catch (error) {
      console.error('Error unlocking user:', error)
      throw error
    }
  },

  async getUserStats(): Promise<UserStats> {
    try {
      const users = await this.getAllUsers()
      return {
        total: users.length,
        managers: users.filter(u => u.role === 'manager').length,
        locked: users.filter(u => u.account_lockout).length,
        active: users.filter(u => !u.account_lockout).length
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      throw error
    }
  },

  async createUser(userData: {
    name: string
    email: string
    password: string
    role: string
    phone?: string
  }): Promise<any> {
    try {
      const response = await apiClient.post(`${API_URL}/register`, userData)
      return response.data
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  // Gestion des signalements
  async getAllProblemes(): Promise<ProblemeRoutier[]> {
    try {
      const response = await apiClient.get(`${API_URL}/problemes`)
      return response.data
    } catch (error) {
      console.error('Error fetching problemes:', error)
      throw error
    }
  },

  async updateProbleme(id: number, data: Partial<ProblemeRoutier>): Promise<ProblemeRoutier> {
    try {
      // Normaliser le statut et valider les données
      const cleanData: any = {
        titre: data.titre?.trim() || '',
        description: data.description?.trim() || '',
        statut: data.statut === 'terminé' ? 'termine' : data.statut,
        surface_m2: Number(data.surface_m2) || 0,
        budget: Number(data.budget) || 0,
        entreprise: data.entreprise?.trim() || null,
        type_probleme: data.type_probleme?.trim() || '',
        type_route: data.type_route?.trim() || '',
        date_signalement: data.date_signalement || null,
        date_debut: data.date_debut || null,
        date_fin: data.date_fin || null,
        // Ne pas oublier latitude/longitude si nécessaire
        latitude: data.latitude,
        longitude: data.longitude
      }

      console.log('Sending update data:', cleanData)
      const response = await apiClient.put(`${API_URL}/problemes/${id}`, cleanData)
      return response.data.data || response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.errors || error.response?.data?.message || error.message
      console.error('Error updating probleme:', errorMessage)
      throw error
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get(`${API_URL}/dashboard`)
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  },

  // Statistiques de signalements
  async getReportStats(problemes: ProblemeRoutier[]) {
    return {
      total: problemes.length,
      new: problemes.filter(p => p.statut === 'nouveau').length,
      inProgress: problemes.filter(p => p.statut === 'en_cours').length,
      completed: problemes.filter(p => p.statut === 'termine').length
    }
  },

  // Calcul du délai moyen de traitement
  calculateProcessingStats(problemes: ProblemeRoutier[]) {
    const stats: any = {}
    
    problemes.forEach(probleme => {
      const type = probleme.type_probleme
      if (!stats[type]) {
        stats[type] = { type, count: 0, totalDays: 0, totalBudget: 0 }
      }
      stats[type].count++
      stats[type].totalBudget += probleme.budget || 0
      
      if (probleme.date_signalement && probleme.date_fin) {
        const start = new Date(probleme.date_signalement)
        const end = new Date(probleme.date_fin)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        stats[type].totalDays += days
      }
    })
    
    return Object.values(stats).map((stat: any) => ({
      type: this.formatTypeName(stat.type),
      avgDays: stat.count > 0 && stat.totalDays > 0 ? Math.ceil(stat.totalDays / stat.count) : '-',
      count: stat.count,
      totalBudget: stat.totalBudget
    }))
  },

  formatTypeName(type: string): string {
    const names: any = {
      'nid_de_poule': 'Nid de poule',
      'fissure': 'Fissure',
      'affaissement': 'Affaissement',
      'autre': 'Autre'
    }
    return names[type] || type.charAt(0).toUpperCase() + type.slice(1)
  }
}
