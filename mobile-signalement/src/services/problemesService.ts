// Service pour les problèmes/signalements - Appels API au backend Laravel
import api from './api';
import type { Probleme } from '../types';

/**
 * Récupérer tous les problèmes
 */
export async function getProblemes(): Promise<Probleme[]> {
  const response = await api.get('/problemes');
  return response.data.data || response.data;
}

/**
 * Récupérer un problème par ID
 */
export async function getProbleme(id: number): Promise<Probleme> {
  const response = await api.get(`/problemes/${id}`);
  return response.data.data || response.data;
}

/**
 * Créer un nouveau problème
 */
export async function createProbleme(data: Partial<Probleme>): Promise<Probleme> {
  const response = await api.post('/problemes', data);
  return response.data.data || response.data;
}

/**
 * Mettre à jour un problème
 */
export async function updateProbleme(
  id: number,
  data: Partial<Probleme>
): Promise<Probleme> {
  const response = await api.put(`/problemes/${id}`, data);
  return response.data.data || response.data;
}

/**
 * Supprimer un problème
 */
export async function deleteProbleme(id: number): Promise<void> {
  await api.delete(`/problemes/${id}`);
}

/**
 * Récupérer les photos d'un problème
 */
export async function getProblemePhotos(problemeId: number) {
  const response = await api.get(`/problemes/${problemeId}/photos`);
  return response.data.data || response.data;
}

/**
 * Récupérer les statistiques du dashboard
 */
export async function getDashboardStats() {
  const response = await api.get('/dashboard');
  return response.data;
}
