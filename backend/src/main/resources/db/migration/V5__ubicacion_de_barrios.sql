ALTER TABLE neighborhoods
    ADD COLUMN latitude  DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION;

UPDATE neighborhoods n
SET latitude = v.latitude, longitude = v.longitude
FROM (VALUES
    ('Yanahuara', -16.3889, -71.5422),
    ('Cayma', -16.3716, -71.5469),
    ('Cerro Colorado', -16.3779, -71.5594),
    ('Cercado - Arequipa', -16.3989, -71.5369),
    ('Paucarpata', -16.4296, -71.5038),
    ('José Luis Bustamante y Rivero', -16.4214, -71.5299),
    ('Alto Selva Alegre', -16.3792, -71.5203),
    ('Miraflores', -16.3933, -71.5200),
    ('Sachaca', -16.4239, -71.5644),
    ('Mariano Melgar', -16.4048, -71.5096),
    ('Socabaya', -16.4673, -71.5297),
    ('Hunter', -16.4440, -71.5560)
) AS v (name, latitude, longitude)
WHERE n.name = v.name;

UPDATE addresses a
SET latitude = n.latitude, longitude = n.longitude
FROM neighborhoods n
WHERE a.latitude IS NULL
  AND a.longitude IS NULL
  AND lower(a.neighborhood) = lower(n.name)
  AND n.latitude IS NOT NULL;
