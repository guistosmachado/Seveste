-- Uso (a partir da pasta api/):  psql -U postgres -f sql/setup.sql
-- ATENCAO: este script apaga e recria o banco seveste_db. Nao execute em um banco com dados que voce queira manter.
DROP DATABASE IF EXISTS seveste_db;
CREATE DATABASE seveste_db;
\c seveste_db

-- 1. User Types Table
CREATE TABLE user_types (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL UNIQUE
);

-- os valores precisam ser iguais aos usados na API (models.TipoDoador / models.TipoAcolhido)
INSERT INTO user_types (type) VALUES ('doador'), ('acolhido');

-- 2. Cities Table (o nome da cidade e unico, sem diferenciar maiusculas de minusculas)
CREATE TABLE cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL
);

CREATE UNIQUE INDEX uq_cities_name ON cities (lower(name));

-- 3. Addresses Table
CREATE TABLE addresses (
  id BIGSERIAL PRIMARY KEY,
  address_line1 VARCHAR(400) NOT NULL,
  number VARCHAR(20),
  state CHAR(2) NOT NULL,
  complement VARCHAR(100),
  city_id INT NOT NULL,

  CONSTRAINT fk_addresses_city FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- 4. Users Table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(300) NOT NULL,
  phone VARCHAR(20),
  state CHAR(2) NOT NULL,
  city_id INT NOT NULL,
  user_type_id INT NOT NULL,
  -- LGPD: quando o usuario aceitou os Termos de Uso e a Politica de Privacidade, e qual versao deles
  terms_accepted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  terms_version VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT ck_users_email_lower CHECK (email = lower(email)),
  CONSTRAINT fk_users_city FOREIGN KEY (city_id) REFERENCES cities(id),
  CONSTRAINT fk_users_user_type FOREIGN KEY (user_type_id) REFERENCES user_types(id)
);

-- 5. Recipient Profiles Table (dados pessoais que so existem para usuarios "acolhido")
CREATE TABLE recipient_profiles (
  user_id BIGINT PRIMARY KEY,
  clothing_size VARCHAR(10) NOT NULL,
  shoe_size SMALLINT NOT NULL,
  wanted_items TEXT[] NOT NULL DEFAULT '{}',

  CONSTRAINT fk_recipient_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Donations Table
CREATE TABLE donations (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  address_id BIGINT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(400) NOT NULL,
  category VARCHAR(50) NOT NULL,
  size VARCHAR(20) NOT NULL,
  condition VARCHAR(40) NOT NULL,
  delivery_type VARCHAR(40) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'disponivel',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT ck_donations_status CHECK (status IN ('disponivel', 'reservada', 'concluida')),
  CONSTRAINT ck_donations_delivery_type CHECK (delivery_type IN ('retirada', 'entrega', 'a_combinar')),
  CONSTRAINT fk_donations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_donations_address FOREIGN KEY (address_id) REFERENCES addresses(id)
);

CREATE INDEX idx_donations_user ON donations (user_id);
CREATE INDEX idx_donations_status ON donations (status);

-- 7. Requests Table
CREATE TABLE requests (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  donation_id BIGINT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT ck_requests_status CHECK (status IN ('PENDENTE', 'ACEITA', 'RECUSADA')),
  CONSTRAINT fk_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_requests_donation FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

CREATE INDEX idx_requests_user ON requests (user_id);
CREATE INDEX idx_requests_donation ON requests (donation_id);

-- regras de negocio garantidas pelo proprio banco (mesmo com duas requisicoes simultaneas):
-- um usuario nao tem duas solicitacoes ativas para a mesma doacao, e uma doacao so tem uma solicitacao aceita
CREATE UNIQUE INDEX uq_requests_active_per_user ON requests (user_id, donation_id) WHERE status IN ('PENDENTE', 'ACEITA');
CREATE UNIQUE INDEX uq_requests_one_accepted ON requests (donation_id) WHERE status = 'ACEITA';

-- 8. Donation Images Table
CREATE TABLE donation_images (
  id BIGSERIAL PRIMARY KEY,
  donation_id BIGINT NOT NULL,
  position INT NOT NULL,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  url VARCHAR(300) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_donation_images_donation FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

CREATE INDEX idx_donation_images_donation ON donation_images (donation_id);

-- uma unica capa por doacao
CREATE UNIQUE INDEX uq_donation_images_one_cover ON donation_images (donation_id) WHERE is_cover;

-- 9. Listing History Table
CREATE TABLE listing_histories (
  id BIGSERIAL PRIMARY KEY,
  donation_id BIGINT NOT NULL,
  status VARCHAR(60) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_listing_histories_donation FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

CREATE INDEX idx_listing_histories_donation ON listing_histories (donation_id);
