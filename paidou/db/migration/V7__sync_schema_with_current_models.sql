-- Synchronise les migrations historiques avec les entites JPA actuelles.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS id_coordinateur BIGINT;

ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'directrice';

UPDATE users
SET role = LOWER(role)
WHERE role IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_id_coordinateur_fkey'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_id_coordinateur_fkey
            FOREIGN KEY (id_coordinateur) REFERENCES users(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_prenom_key'
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_prenom_key UNIQUE (prenom);
    END IF;
END $$;

ALTER TABLE creches
    ADD COLUMN IF NOT EXISTS est_ferme BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE creches
    ALTER COLUMN id_directeur DROP NOT NULL;

ALTER TABLE vaccins
    ADD COLUMN IF NOT EXISTS ne_avant_le DATE,
    ADD COLUMN IF NOT EXISTS ne_apres_le DATE,
    ADD COLUMN IF NOT EXISTS est_obsolete BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    id_user BIGINT,
    nom_creche VARCHAR(255),
    id_enfant BIGINT,
    id_vaccin BIGINT,
    timestamp TIMESTAMP NOT NULL,
    details TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255),
    categorie VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role VARCHAR(255) NOT NULL,
    permission_id BIGINT NOT NULL,
    CONSTRAINT role_permissions_permission_id_fkey
        FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role
    ON role_permissions(role);
