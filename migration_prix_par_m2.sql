-- Migration: Création de la table prix_par_m2 (table de référence)
-- Date: 2026-02-10
-- Description: Table de référence des prix par m² selon le type de problème et de route
--              Permet de calculer automatiquement le budget: budget = prix_par_m2 × niveau × surface_m2

-- Créer la table de référence des prix
CREATE TABLE IF NOT EXISTS prix_par_m2 (
    id_prix SERIAL PRIMARY KEY,
    type_probleme VARCHAR(50) NOT NULL,
    type_route VARCHAR(50) NOT NULL,
    prix DECIMAL(10, 2) NOT NULL,
    date_debut DATE NOT NULL DEFAULT CURRENT_DATE,
    date_fin DATE DEFAULT NULL,
    actif BOOLEAN DEFAULT TRUE,
    description TEXT,
    CONSTRAINT unique_type_actif UNIQUE (type_probleme, type_route, actif)
);

-- Commentaire sur la table
COMMENT ON TABLE prix_par_m2 IS 'Table de référence des prix par m² selon le type de problème et de route';
COMMENT ON COLUMN prix_par_m2.type_probleme IS 'Type de problème (nid_de_poule, fissure, affaissement, autre)';
COMMENT ON COLUMN prix_par_m2.type_route IS 'Type de route (route, pont, trottoir, piste_cyclable, autre)';
COMMENT ON COLUMN prix_par_m2.prix IS 'Prix par m² en euros';
COMMENT ON COLUMN prix_par_m2.date_debut IS 'Date de début de validité du prix';
COMMENT ON COLUMN prix_par_m2.date_fin IS 'Date de fin de validité du prix (NULL = actif)';
COMMENT ON COLUMN prix_par_m2.actif IS 'Indique si ce prix est actuellement actif';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_prix_type_probleme ON prix_par_m2(type_probleme);
CREATE INDEX IF NOT EXISTS idx_prix_type_route ON prix_par_m2(type_route);
CREATE INDEX IF NOT EXISTS idx_prix_actif ON prix_par_m2(actif);

-- Insérer des données de référence (exemples)
INSERT INTO prix_par_m2 (type_probleme, type_route, prix, description) VALUES
-- Nid de poule
('nid_de_poule', 'route', 150.00, 'Réparation nid de poule - route standard'),
('nid_de_poule', 'pont', 250.00, 'Réparation nid de poule - pont (accès difficile)'),
('nid_de_poule', 'trottoir', 120.00, 'Réparation nid de poule - trottoir'),
('nid_de_poule', 'piste_cyclable', 130.00, 'Réparation nid de poule - piste cyclable'),

-- Fissure
('fissure', 'route', 180.00, 'Réparation fissure - route standard'),
('fissure', 'pont', 300.00, 'Réparation fissure - pont (structure sensible)'),
('fissure', 'trottoir', 140.00, 'Réparation fissure - trottoir'),
('fissure', 'piste_cyclable', 150.00, 'Réparation fissure - piste cyclable'),

-- Affaissement
('affaissement', 'route', 350.00, 'Réparation affaissement - route (travaux importants)'),
('affaissement', 'pont', 500.00, 'Réparation affaissement - pont (structure critique)'),
('affaissement', 'trottoir', 200.00, 'Réparation affaissement - trottoir'),
('affaissement', 'piste_cyclable', 250.00, 'Réparation affaissement - piste cyclable'),

-- Autre
('autre', 'route', 200.00, 'Réparation standard - route'),
('autre', 'pont', 350.00, 'Réparation standard - pont'),
('autre', 'trottoir', 160.00, 'Réparation standard - trottoir'),
('autre', 'piste_cyclable', 180.00, 'Réparation standard - piste cyclable')
ON CONFLICT (type_probleme, type_route, actif) DO NOTHING;

-- Vérification
SELECT * FROM prix_par_m2 ORDER BY type_probleme, type_route;

