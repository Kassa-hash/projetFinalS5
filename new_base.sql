CREATE TABLE probleme_routier (
    id_probleme SERIAL PRIMARY KEY,       
    titre VARCHAR(150),                   
    description TEXT,                     
    statut VARCHAR(20) CHECK (statut IN ('nouveau','en_cours','termine')), 
    date_signalement DATE,                
    date_debut DATE,                      
    date_fin DATE,                        
    surface_m2 NUMERIC(10,2),            
    budget NUMERIC(14,2),                 
    entreprise VARCHAR(150),              
    latitude DECIMAL(10,6),               
    longitude DECIMAL(10,6),
    type_probleme VARCHAR(50) CHECK (type_probleme IN ('nid_de_poule','fissure','affaissement','autre')), 
    type_route VARCHAR(50) CHECK (type_route IN ('pont','trottoir','route','piste_cyclable','autre'))
);


CREATE INDEX idx_probleme_coords
ON probleme_routier(latitude, longitude);
