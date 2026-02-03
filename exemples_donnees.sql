-- Exemples de données pour la table probleme_routier

-- Insérer quelques problèmes routiers d'exemple
INSERT INTO probleme_routier (titre, description, statut, date_signalement, date_debut, date_fin, surface_m2, budget, entreprise, latitude, longitude, type_probleme, type_route) VALUES
(
  'Nid de poule Rue de France',
  'Plusieurs nids de poule sur la rue de France près du feu tricolore. Danger pour les véhicules.',
  'nouveau',
  '2026-02-01',
  NULL,
  NULL,
  12.5,
  450000,
  NULL,
  -18.8792,
  47.5079,
  'nid_de_poule',
  'route'
),
(
  'Fissure importante Avenue de l''Indépendance',
  'Fissure longitudinale importante sur l''avenue de l''Indépendance. Risque d''effondrement.',
  'en_cours',
  '2026-01-28',
  '2026-02-01',
  '2026-02-10',
  35.75,
  1500000,
  'BTP Madagascar',
  -18.8750,
  47.5150,
  'fissure',
  'route'
),
(
  'Affaissement trottoir Place de l''Indépendance',
  'Le trottoir s''est affaissé d''environ 10cm, créant un risque de chute.',
  'termine',
  '2026-01-15',
  '2026-01-20',
  '2026-01-31',
  8.0,
  280000,
  'Rénovation Urbaine SA',
  -18.8800,
  47.5200,
  'affaissement',
  'trottoir'
),
(
  'Chaussée défoncée Boulevard de la Reine',
  'Plusieurs zones de dégradation avancée sur le boulevard. Nombreux nids de poule et affaissements.',
  'nouveau',
  '2026-02-02',
  NULL,
  NULL,
  45.30,
  2000000,
  NULL,
  -18.8700,
  47.5100,
  'nid_de_poule',
  'route'
),
(
  'Pont Route Nationale 5',
  'Détérioration des joints et légère corrosion des câbles de soutien. Inspection recommandée.',
  'en_cours',
  '2026-01-10',
  '2026-02-01',
  '2026-03-15',
  120.0,
  8500000,
  'Travaux Publics Côtier',
  -18.8650,
  47.5250,
  'fissure',
  'pont'
),
(
  'Piste cyclable Quartier de la Cité',
  'Revêtement très dégradé, asphalte écaillé et plusieurs nids de poule.',
  'nouveau',
  '2026-02-03',
  NULL,
  NULL,
  22.5,
  650000,
  NULL,
  -18.8900,
  47.5000,
  'nid_de_poule',
  'piste_cyclable'
);

-- Afficher les IDs insérés pour référence
SELECT id_probleme, titre, statut FROM probleme_routier WHERE titre LIKE '%Rue de France%' OR titre LIKE '%Avenue%' OR titre LIKE '%Place%' OR titre LIKE '%Boulevard%' OR titre LIKE '%Pont%' OR titre LIKE '%Piste%' ORDER BY id_probleme DESC LIMIT 6;
