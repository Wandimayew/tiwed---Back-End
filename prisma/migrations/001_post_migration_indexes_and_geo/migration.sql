-- Add geography column
ALTER TABLE IF EXISTS "UserProfile"
  ADD COLUMN IF NOT EXISTS location geography(Point,4326);

-- Populate location from lat/lng
UPDATE "UserProfile"
SET location = ST_SetSRID(ST_MakePoint(COALESCE("locationLng",0.0), COALESCE("locationLat",0.0)), 4326)
WHERE location IS NULL;

-- GIST index for geo queries
CREATE INDEX IF NOT EXISTS idx_userprofile_location_gist ON "UserProfile" USING GIST(location);

-- GIN index for interests array
CREATE INDEX IF NOT EXISTS idx_userprofile_interests_gin ON "UserProfile" USING GIN (interests);

-- Trigram index for displayName
CREATE INDEX IF NOT EXISTS idx_userprofile_displayname_trgm ON "UserProfile" USING gin ("displayName" gin_trgm_ops);

-- Full-text search vector
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='UserProfile' AND column_name='search_vector'
  ) THEN
    ALTER TABLE "UserProfile" ADD COLUMN search_vector tsvector;
  END IF;
END$$;

-- Populate search_vector
UPDATE "UserProfile" SET search_vector =
  setweight(to_tsvector('english', coalesce("displayName",'')::text), 'A') ||
  setweight(to_tsvector('english', coalesce(about,'')::text), 'B') ||
  setweight(to_tsvector('english', array_to_string(coalesce(interests, '{}'::text[]), ' ')), 'C')
WHERE search_vector IS NULL;

-- Trigger to auto-update search_vector
CREATE OR REPLACE FUNCTION userprofile_search_vector_update() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW."displayName", '')::text), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."about", '')::text), 'B') ||
    setweight(to_tsvector('english', array_to_string(coalesce(NEW."interests", '{}'::text[]), ' ')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tsvectorupdate ON "UserProfile";
CREATE TRIGGER tsvectorupdate BEFORE INSERT OR UPDATE
  ON "UserProfile" FOR EACH ROW EXECUTE PROCEDURE userprofile_search_vector_update();
