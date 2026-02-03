-- ============================================
-- SCHEMA : Suivi des travaux routiers - TANA
-- PostgreSQL
-- ============================================

-- =========================
-- 1. UTILISATEURS (Managers uniquement)
-- =========================
CREATE TABLE utilisateur (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    username VARCHAR(50),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

-- Historique blocage / déblocage
CREATE TABLE historique_blocage (
    id SERIAL PRIMARY KEY,
    utilisateur_id INT REFERENCES utilisateur(id) ON DELETE CASCADE,
    bloque BOOLEAN NOT NULL,
    date_action TIMESTAMP DEFAULT now()
);

-- =========================
-- 2. STATUTS
-- =========================
CREATE TABLE statut (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    libelle VARCHAR(100) NOT NULL
);

-- =========================
-- 3. TYPES DE TRAVAUX
-- =========================
CREATE TABLE type_travaux (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(100) NOT NULL
);

-- =========================
-- 4. ENTREPRISES
-- =========================
CREATE TABLE entreprise (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    contact VARCHAR(100),
    type_travaux_id INT REFERENCES type_travaux(id)
);

-- =========================


-- =========================


-- =========================
-- 7. HISTORIQUE STATUT SIGNALEMENT
-- =========================
CREATE TABLE historique_statut_signalement (
    id SERIAL PRIMARY KEY,
    signalement_id INT REFERENCES signalement(id) ON DELETE CASCADE,
    statut_id INT REFERENCES statut(id),
    date_changement TIMESTAMP DEFAULT now()
);

-- =========================
-- 8. COMMENTAIRES SIGNALEMENT
-- =========================
CREATE TABLE commentaire_signalement (
    id SERIAL PRIMARY KEY,
    signalement_id INT REFERENCES signalement(id) ON DELETE CASCADE,
    utilisateur_id INT REFERENCES utilisateur(id),
    commentaire TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- 9. DONNEES INITIALES
-- =========================
INSERT INTO statut (code, libelle) VALUES
('NOUVEAU', 'Nouveau signalement'),
('EN_COURS', 'Travaux en cours'),
('TERMINE', 'Travaux terminés');

INSERT INTO type_travaux (libelle) VALUES
('Route'),
('Trottoir'),
('Pont'),
('Canalisation');
