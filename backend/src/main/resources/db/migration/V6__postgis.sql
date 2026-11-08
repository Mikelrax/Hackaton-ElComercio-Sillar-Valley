CREATE EXTENSION IF NOT EXISTS postgis;

UPDATE addresses
SET latitude = -16.3988, longitude = -71.535
WHERE latitude IS NULL OR longitude IS NULL;

ALTER TABLE addresses
    ALTER COLUMN latitude SET NOT NULL,
    ALTER COLUMN longitude SET NOT NULL;

ALTER TABLE neighborhoods
    ALTER COLUMN latitude SET NOT NULL,
    ALTER COLUMN longitude SET NOT NULL;

ALTER TABLE posts
    ADD COLUMN latitude  DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION;

UPDATE posts p
SET latitude = a.latitude, longitude = a.longitude, neighborhood = COALESCE(p.neighborhood, a.neighborhood)
FROM addresses a
WHERE a.user_id = p.author_id AND a.is_primary;

UPDATE posts
SET latitude = -16.3988, longitude = -71.535
WHERE latitude IS NULL OR longitude IS NULL;

ALTER TABLE posts
    ALTER COLUMN latitude SET NOT NULL,
    ALTER COLUMN longitude SET NOT NULL;

ALTER TABLE neighborhoods
    ADD COLUMN geog geography(Point, 4326)
        GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;
ALTER TABLE addresses
    ADD COLUMN geog geography(Point, 4326)
        GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;
ALTER TABLE businesses
    ADD COLUMN geog geography(Point, 4326)
        GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;
ALTER TABLE posts
    ADD COLUMN geog geography(Point, 4326)
        GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;
ALTER TABLE emergency_reports
    ADD COLUMN geog geography(Point, 4326)
        GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;
ALTER TABLE support_points
    ADD COLUMN geog geography(Point, 4326)
        GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) STORED;

DROP INDEX IF EXISTS idx_businesses_location;

CREATE INDEX idx_neighborhoods_geog ON neighborhoods USING GIST (geog);
CREATE INDEX idx_addresses_geog ON addresses USING GIST (geog);
CREATE INDEX idx_businesses_geog ON businesses USING GIST (geog);
CREATE INDEX idx_posts_geog ON posts USING GIST (geog);
CREATE INDEX idx_emergency_reports_geog ON emergency_reports USING GIST (geog);
CREATE INDEX idx_support_points_geog ON support_points USING GIST (geog);
