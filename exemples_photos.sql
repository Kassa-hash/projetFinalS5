-- Exemples de données pour la table photos
-- À exécuter APRÈS les données probleme_routier
-- Les IDs de problème doivent correspondre aux données insérées

-- Supposant que les problèmes ont les IDs 1 à 6, voici comment ajouter des photos:

-- Pour le problème 1 (Nid de poule Rue de France)
INSERT INTO photos (id_probleme, nom_fichier, chemin_fichier, mime_type, taille, description, date_upload) VALUES
(1, 'media-literacy-for-all-3-600x399.png', 'photos/probleme_1/media-literacy-for-all-3-600x399.png', 'image/png', 125430, 'Vue générale du nid de poule', NOW());

-- Pour le problème 2 (Fissure Avenue)
INSERT INTO photos (id_probleme, nom_fichier, chemin_fichier, mime_type, taille, description, date_upload) VALUES
(2, 'media-literacy-for-all-3-600x399.png', 'photos/probleme_2/media-literacy-for-all-3-600x399.png', 'image/png', 125430, 'Fissure vue de près', NOW()),
(2, 'media-literacy-for-all-3-600x399.png', 'photos/probleme_2/media-literacy-another.png', 'image/png', 125430, 'Fissure vue de côté', NOW());

-- Pour le problème 3 (Affaissement trottoir)
INSERT INTO photos (id_probleme, nom_fichier, chemin_fichier, mime_type, taille, description, date_upload) VALUES
(3, 'media-literacy-for-all-3-600x399.png', 'photos/probleme_3/media-literacy-for-all-3-600x399.png', 'image/png', 125430, 'Affaissement du trottoir', NOW());

-- Pour le problème 4 (Chaussée défoncée)
INSERT INTO photos (id_probleme, nom_fichier, chemin_fichier, mime_type, taille, description, date_upload) VALUES
(4, 'media-literacy-for-all-3-600x399.png', 'photos/probleme_4/media-literacy-for-all-3-600x399.png', 'image/png', 125430, 'Vue générale de la dégradation', NOW()),
(4, 'media-literacy-for-all-3-600x399.png', 'photos/probleme_4/detail-nid-poule.png', 'image/png', 125430, 'Détail d\'un nid de poule', NOW());

-- Pour le problème 5 (Pont)
INSERT INTO photos (id_probleme, nom_fichier, chemin_fichier, mime_type, taille, description, date_upload) VALUES
(5, 'media-literacy-for-all-3-600x399.png', 'photos/probleme_5/media-literacy-for-all-3-600x399.png', 'image/png', 125430, 'Vue du pont', NOW()),
(5, 'media-literacy-for-all-3-600x399.png', 'photos/probleme_5/corrosion.png', 'image/png', 125430, 'Corrosion des câbles', NOW());

-- Pour le problème 6 (Piste cyclable)
INSERT INTO photos (id_probleme, nom_fichier, chemin_fichier, mime_type, taille, description, date_upload) VALUES
(6, 'media-literacy-for-all-3-600x399.png', 'photos/probleme_6/media-literacy-for-all-3-600x399.png', 'image/png', 125430, 'État dégradé de la piste', NOW());

-- Vérifier les données insérées
SELECT p.id, p.id_probleme, pr.titre, p.nom_fichier, p.chemin_fichier, p.description 
FROM photos p
JOIN probleme_routier pr ON p.id_probleme = pr.id_probleme
ORDER BY p.id_probleme, p.id;
