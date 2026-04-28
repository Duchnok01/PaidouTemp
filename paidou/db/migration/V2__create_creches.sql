CREATE TABLE creches (
    nom VARCHAR(255) NOT NULL PRIMARY KEY,
    id_directeur BIGINT NOT NULL,
    FOREIGN KEY (id_directeur) REFERENCES users(id)
);