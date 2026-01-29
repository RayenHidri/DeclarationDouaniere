-- Seed roles
INSERT INTO roles (code, label) VALUES ('ADMIN', 'Administrateur');
INSERT INTO roles (code, label) VALUES ('ACHAT', 'Achats');
INSERT INTO roles (code, label) VALUES ('EXPORT', 'Export');
INSERT INTO roles (code, label) VALUES ('DGA', 'Direction Générale');

-- NOTE: replace the password_hash values by real bcrypt hashes before use.
-- Example (node): require('bcrypt').hashSync('password', 10)

-- Seed users (email unique)
INSERT INTO users (full_name, email, password_hash, is_active) VALUES ('Admin User', 'admin@intermetal.com', 'SOME_BCRYPT_HASH', 1);
INSERT INTO users (full_name, email, password_hash, is_active) VALUES ('DGA User', 'mouradc@intermetal.com', 'SOME_BCRYPT_HASH', 1);
INSERT INTO users (full_name, email, password_hash, is_active) VALUES ('Achat User', 'achat@intermetal.com', 'SOME_BCRYPT_HASH', 1);
INSERT INTO users (full_name, email, password_hash, is_active) VALUES ('Export User', 'export@intermetal.com', 'SOME_BCRYPT_HASH', 1);

-- Map roles (replace role ids if needed)
-- use queries to find ids, for example:
-- DECLARE @adminId BIGINT = (SELECT id FROM users WHERE email = 'admin@intermetal.com');
-- DECLARE @adminRoleId BIGINT = (SELECT id FROM roles WHERE code = 'ADMIN');

-- Example inserts (adjust ids to your DB):
-- INSERT INTO user_roles (user_id, role_id) VALUES (@adminId, @adminRoleId);

-- Add sample families
INSERT INTO sa_families (code, label, scrap_percent, is_active) VALUES ('ROND', 'Rond à béton', 5, 1);
INSERT INTO sa_families (code, label, scrap_percent, is_active) VALUES ('FILS', 'Fils machine', 6, 1);
INSERT INTO sa_families (code, label, scrap_percent, is_active) VALUES ('CARRE', 'Fer carré', 8, 1);

-- Add sample suppliers and customers
INSERT INTO suppliers (name, code, is_active) VALUES ('Fournisseur A', 'SUP-A', 1);
INSERT INTO customers (name, code, is_active) VALUES ('Client A', 'CLI-A', 1);
