CREATE TABLE enregistrement_vaccinations (
    id_enfant BIGINT NOT NULL,
    id_vaccin BIGINT NOT NULL,
    date_vaccination DATE NOT NULL,
    id_creche VARCHAR(255) NOT NULL,
    id_user BIGINT NOT NULL,
    PRIMARY KEY (id_enfant, id_vaccin, date_vaccination),
    FOREIGN KEY (id_enfant) REFERENCES enfants(id_enfant),
    FOREIGN KEY (id_vaccin) REFERENCES vaccins(id),
    FOREIGN KEY (id_creche) REFERENCES creches(nom),
    FOREIGN KEY (id_user) REFERENCES users(id)
);