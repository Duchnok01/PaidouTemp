CREATE TABLE enfants (
    id_enfant BIGSERIAL PRIMARY KEY,
    prenom VARCHAR(255) NOT NULL,
    nom VARCHAR(255) NOT NULL,
    date_de_naissance DATE NOT NULL,
    nom_creche VARCHAR(255) NOT NULL,
    est_parti BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (nom_creche) REFERENCES creches(nom)
);