-- Base de datos local para desarrollo. Ejecutar UNA vez conectado como postgres:
--   psql -U postgres -h localhost -f backend/db/00_crear_base.sql
-- Flyway crea las tablas al arrancar el backend.
CREATE ROLE ayni WITH LOGIN PASSWORD 'ayni';
CREATE DATABASE ayni OWNER ayni ENCODING 'UTF8' TEMPLATE template0;
