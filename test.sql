-- Insertion de données pour les problèmes routiers d'Antananarivo

INSERT INTO probleme_routier (
    titre, 
    description, 
    statut, 
    date_signalement, 
    date_debut, 
    date_fin, 
    surface_m2, 
    budget, 
    entreprise, 
    latitude, 
    longitude, 
    type_probleme, 
    type_route
) VALUES 

(
    'Détérioration piste cyclable RN7',
    'Piste cyclable en mauvais état, dalles cassées',
    'termine',
    '2024-12-05',
    '2024-12-18',
    '2025-01-08',
    38.90,
    7800000,
    'COLAS MADAGASCAR',
    -18.9323,
    47.5512,
    'autre',
    'piste_cyclable'
),


-- Zone Behoririka
(
    'Fissures multiples Rue Rainandriamampandry',q
    'Plusieurs fissures longitudinales sur 50m, risque d''affaissement',
    'nouveau',
    '2025-01-22',
    NULL,
    NULL,
    45.80,
    8900000,
    NULL,
    -18.9167,
    47.5265,
    'fissure',
    'route'
);

-- Zone 67 ha
(
    'Affaissement Boulevard de l''Europe',
    'Affaissement de la chaussée suite aux pluies, circulation dangereuse',
    'termine',
    '2024-12-10',
    '2024-12-15',
    '2025-01-10',
    28.30,
    5600000,
    'COLAS MADAGASCAR',
    -18.9189,
    47.5342,
    'affaissement',
    'route'
),

-- Trottoir Analakely
(
    'Trottoir dégradé Place de l''Indépendance',
    'Dalles cassées et manquantes, dangereux pour les piétons',
    'nouveau',
    '2025-01-24',
    NULL,
    NULL,
    18.60,
    3200000,
    NULL,
    -18.9145,
    47.5215,
    'autre',
    'trottoir'
),

-- Zone Andohalo
(
    'Nids de poule Tunnel Andohalo',
    'Multiples nids de poule dans le tunnel, ralentissement du trafic',
    'en_cours',
    '2025-01-18',
    '2025-01-25',
    NULL,
    35.20,
    7100000,
    'TRAVAUX PUBLICS MADA',
    -18.9078,
    47.5289,
    'nid_de_poule',
    'route'
),

-- Piste cyclable Anosy
(
    'Fissures piste cyclable Lac Anosy',
    'Fissures sur la piste cyclable autour du lac',
    'nouveau',
    '2025-01-20',
    NULL,
    NULL,
    22.40,
    4500000,
    NULL,
    -18.9232,
    47.5178,
    'fissure',
    'piste_cyclable'
),

-- Zone Ambohijatovo
(
    'Route détériorée Avenue Grandidier',
    'Chaussée fortement dégradée sur 100m, nécessite réfection complète',
    'en_cours',
    '2025-01-12',
    '2025-01-22',
    NULL,
    67.50,
    13500000,
    'COLAS MADAGASCAR',
    -18.9195,
    47.5267,
    'autre',
    'route'
),

-- Pont Anosy
(
    'Fissures structurelles Pont Anosy',
    'Fissures visibles sur le tablier du pont, expertise nécessaire',
    'nouveau',
    '2025-01-23',
    NULL,
    NULL,
    15.80,
    12000000,
    NULL,
    -18.9245,
    47.5189,
    'fissure',
    'pont'
),

-- Zone Isoraka
(
    'Nid de poule Rue Andrianary',
    'Gros nid de poule devant l''ambassade de France',
    'termine',
    '2024-12-28',
    '2025-01-05',
    '2025-01-12',
    8.20,
    1800000,
    'TRAVAUX PUBLICS MADA',
    -18.9156,
    47.5301,
    'nid_de_poule',
    'route'
),

-- Zone Tsaralalana
(
    'Affaissement Rue Patrice Lumumba',
    'Début d''affaissement, intervention urgente requise',
    'en_cours',
    '2025-01-19',
    '2025-01-24',
    NULL,
    31.70,
    6800000,
    'COLAS MADAGASCAR',
    -18.9123,
    47.5243,
    'affaissement',
    'route'
),

-- Trottoir Ambohijatovo
(
    'Trottoir cassé Avenue du Président Wilson',
    'Pavés manquants et cassés sur 30m',
    'nouveau',
    '2025-01-25',
    NULL,
    NULL,
    24.50,
    4100000,
    NULL,
    -18.9201,
    47.5278,
    'autre',
    'trottoir'
),

-- Zone Mahamasina
(
    'Nids multiples Boulevard Ratsimilaho',
    'Série de nids de poule près du stade',
    'nouveau',
    '2025-01-21',
    NULL,
    NULL,
    42.60,
    8500000,
    NULL,
    -18.9089,
    47.5312,
    'nid_de_poule',
    'route'
),

-- Zone Antanimena
(
    'Fissures Route Digue',
    'Fissures importantes sur la route digue, risque inondation',
    'en_cours',
    '2025-01-14',
    '2025-01-20',
    NULL,
    56.30,
    11200000,
    'TRAVAUX PUBLICS MADA',
    -18.9267,
    47.5423,
    'fissure',
    'route'
),

-- Piste cyclable Andohatapenaka


-- Zone Analakely
(
    'Nid de poule Avenue de l''Indépendance',
    'Important nid de poule causant des dégâts aux véhicules, situé devant le marché Analakely',
    'en_cours',
    '2025-01-15',
    '2025-01-20',
    NULL,
    12.50,
    2500000,
    'TRAVAUX PUBLICS MADA',
    -18.9134,
    47.5228,
    'nid_de_poule',
    'route'
),

-- Zone Ampefiloha
(
    'Affaissement parking ministère',
    'Parking en affaissement progressif',
    'nouveau',
    '2025-01-26',
    NULL,
    NULL,
    73.20,
    14600000,
    NULL,
    -18.9101,
    47.5378,
    'affaissement',
    'route'
);