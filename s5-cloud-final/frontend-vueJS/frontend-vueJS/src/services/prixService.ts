import apiClient from './api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export interface PrixParM2 {
  id_prix: number
  type_probleme: string
  type_route: string
  prix: number
  date_debut: string
  date_fin: string | null
  actif: boolean
  description: string | null
}

export const prixService = {
  /**
   * Récupérer tous les prix actifs
   */
  async getAllPrix(): Promise<PrixParM2[]> {
    try {
      const response = await apiClient.get(`${API_URL}/prix-par-m2`)
      return response.data
    } catch (error) {
      console.error('Error fetching prix:', error)
      throw error
    }
  },

  /**
   * Récupérer le prix pour une combinaison type_probleme + type_route
   */
  async getPrix(typeProbleme: string, typeRoute: string): Promise<PrixParM2 | null> {
    try {
      const response = await apiClient.post(`${API_URL}/prix-par-m2/get-prix`, {
        type_probleme: typeProbleme,
        type_route: typeRoute
      })
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`Prix non trouvé pour ${typeProbleme} + ${typeRoute}`)
        return null
      }
      console.error('Error fetching prix:', error)
      throw error
    }
  },

  /**
   * Créer un nouveau prix
   */
  async createPrix(data: {
    type_probleme: string
    type_route: string
    prix: number
    description?: string
  }): Promise<PrixParM2> {
    try {
      const response = await apiClient.post(`${API_URL}/prix-par-m2`, data)
      return response.data.data
    } catch (error) {
      console.error('Error creating prix:', error)
      throw error
    }
  },

  /**
   * Mettre à jour un prix
   */
  async updatePrix(idPrix: number, data: Partial<PrixParM2>): Promise<PrixParM2> {
    try {
      const response = await apiClient.put(`${API_URL}/prix-par-m2/${idPrix}`, data)
      return response.data.data
    } catch (error) {
      console.error('Error updating prix:', error)
      throw error
    }
  },

  /**
   * Désactiver un prix
   */
  async deletePrix(idPrix: number): Promise<void> {
    try {
      await apiClient.delete(`${API_URL}/prix-par-m2/${idPrix}`)
    } catch (error) {
      console.error('Error deleting prix:', error)
      throw error
    }
  }
}
