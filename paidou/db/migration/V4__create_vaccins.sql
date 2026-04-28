CREATE TABLE vaccins (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    maladies_prevenues VARCHAR(255) NOT NULL,
    pour_enfants_nes_avant INT,
    pour_enfants_nes_apres INT,
    age_premiere_vaccination INT NOT NULL,
    nb_mois_premier_delai INT NOT NULL,
    nb_mois_deuxieme_delai INT
);