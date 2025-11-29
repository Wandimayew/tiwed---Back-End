SET search_path TO public;

-- migrations/000_create_extensions.sql
-- Run this BEFORE running Prisma migrations if you rely on these extensions.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "hstore";

-- PostGIS is optional if you want geography/geometry types.
-- If you plan to use PostGIS geography(Point,4326) for geo queries, enable it now:
CREATE EXTENSION IF NOT EXISTS postgis;
