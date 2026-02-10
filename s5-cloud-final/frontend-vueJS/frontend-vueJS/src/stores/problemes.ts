import { defineStore } from 'pinia';
import apiClient from '@/services/api';
import type { ProblemeRoutier, DashboardStats } from '@/types/probleme';

interface State {
  problemes: ProblemeRoutier[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
}

export const useProblemesStore = defineStore('problemes', {
  state: (): State => ({
    problemes: [],
    stats: {
      nb_points: 0,
      surface_totale: 0,
      budget_total: 0,
      avancement_pourcent: 0,
    },
    loading: false,
    error: null,
  }),

  actions: {
    async fetchProblemes() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await apiClient.get<ProblemeRoutier[]>('/problemes');
        this.problemes = response.data;
      } catch (error) {
        this.error = 'Erreur lors du chargement des problèmes';
        console.error('Fetch problemes error:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchStats() {
      try {
        const response = await apiClient.get<DashboardStats>('/dashboard');
        this.stats = response.data;
      } catch (error) {
        this.error = 'Erreur lors du chargement des statistiques';
        console.error('Fetch stats error:', error);
        throw error;
      }
    },

    async loadAllData() {
      this.loading = true;
      try {
        await Promise.all([
          this.fetchProblemes(),
          this.fetchStats(),
        ]);
      } catch (error) {
        console.error('Load all data error:', error);
      } finally {
        this.loading = false;
      }
    },
  },
});