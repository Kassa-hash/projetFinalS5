// Types partagés pour l'application Signalement Mobile
// Reproduit les types de l'application VueJS

export type StatutProbleme = 'nouveau' | 'en_cours' | 'termine';
export type TypeProbleme = 'nid_de_poule' | 'fissure' | 'affaissement' | 'autre';
export type TypeRoute = 'pont' | 'trottoir' | 'route' | 'piste_cyclable' | 'autre';

export interface Probleme {
  id?: number;
  firebase_id?: string;
  titre: string;
  description: string;
  type_probleme: TypeProbleme;
  type_route: TypeRoute;
  statut: StatutProbleme;
  latitude: number;
  longitude: number;
  adresse?: string;
  date_signalement: string;
  date_resolution?: string;
  user_id?: number;
  photos?: Photo[];
}

export interface Photo {
  id?: number;
  probleme_id?: number;
  chemin: string;
  url?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface MapMarker {
  id: number | string;
  position: [number, number]; // [lat, lng]
  title: string;
  description: string;
  type: TypeProbleme;
  statut: StatutProbleme;
  photos?: Photo[];
}
