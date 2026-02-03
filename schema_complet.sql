-- ============================================================================
-- SCHEMA COMPLET DE LA BASE DE DONNÉES
-- Gestion des problèmes routiers et photos
-- Generated: 2026-02-03
-- ============================================================================

-- TABLE: users
-- Description: Utilisateurs du système avec authentification Firebase et locale
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    role ENUM('visitor', 'user', 'manager') DEFAULT 'user',
    account_lockout BOOLEAN DEFAULT FALSE,
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: password_reset_tokens
-- Description: Tokens pour réinitialisation de mot de passe
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP
);

-- TABLE: sessions
-- Description: Sessions utilisateur
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id BIGINT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity INTEGER NOT NULL,
    CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES users(id)
);

-- TABLE: probleme_routier
-- Description: Signalements de problèmes routiers (nid-de-poule, fissures, etc.)
CREATE TABLE IF NOT EXISTS probleme_routier (
    id_probleme BIGSERIAL PRIMARY KEY,
    titre VARCHAR(150),
    description TEXT,
    statut ENUM('nouveau', 'en_cours', 'termine') DEFAULT 'nouveau',
    date_signalement DATE,
    date_debut DATE,
    date_fin DATE,
    surface_m2 NUMERIC(10, 2),
    budget NUMERIC(14, 2),
    entreprise VARCHAR(150),
    latitude NUMERIC(10, 6),
    longitude NUMERIC(10, 6),
    type_probleme ENUM('nid_de_poule', 'fissure', 'affaissement', 'autre'),
    type_route ENUM('pont', 'trottoir', 'route', 'piste_cyclable', 'autre'),
    firebase_id VARCHAR(255)
);

-- INDEX: probleme_routier (optimisation des requêtes)
CREATE INDEX IF NOT EXISTS idx_probleme_routier_coords ON probleme_routier(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_probleme_routier_statut ON probleme_routier(statut);
CREATE INDEX IF NOT EXISTS idx_probleme_routier_firebase_id ON probleme_routier(firebase_id);

-- TABLE: photos
-- Description: Photos associées aux problèmes routiers
CREATE TABLE IF NOT EXISTS photos (
    id BIGSERIAL PRIMARY KEY,
    id_probleme BIGINT NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_fichier VARCHAR(255) NOT NULL,
    mime_type VARCHAR(255) DEFAULT 'image/jpeg',
    taille BIGINT,
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(255),
    CONSTRAINT fk_photos_id_probleme 
        FOREIGN KEY (id_probleme) 
        REFERENCES probleme_routier(id_probleme) 
        ON DELETE CASCADE
);

-- INDEX: photos
CREATE INDEX IF NOT EXISTS idx_photos_id_probleme ON photos(id_probleme);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- 1. users              - 7 colonnes (utilisateurs du système)
-- 2. password_reset_tokens - 3 colonnes (réinitialisation de mot de passe)
-- 3. sessions           - 6 colonnes (gestion des sessions)
-- 4. probleme_routier   - 14 colonnes (signalements de problèmes)
-- 5. photos             - 8 colonnes (photos des problèmes)
-- ============================================================================
