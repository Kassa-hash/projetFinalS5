export type StatutProbleme = 'nouveau' | 'en_cours' | 'termine';
export type TypeProbleme = 'nid_de_poule' | 'fissure' | 'affaissement' | 'autre';
export type TypeRoute = 'pont' | 'trottoir' | 'route' | 'piste_cyclable' | 'autre';

export interface ProblemeRoutier {
  id_probleme: number;
  titre: string;
  description: string;
  statut: StatutProbleme;
  date_signalement: string;
  date_debut?: string;
  date_fin?: string;
  surface_m2: number;
  budget: number;
  entreprise?: string;
  latitude: number;
  longitude: number;
  type_probleme: TypeProbleme;
  type_route: TypeRoute;
}

export interface DashboardStats {
  nb_points: number;
  surface_totale: number;
  budget_total: number;
  avancement_pourcent: number;
}