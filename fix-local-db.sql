-- Script para arreglar la base de datos local antes de ejecutar migraciones
-- Ejecutar con: psql -U postgres -d eleven_db -f fix-local-db.sql

-- 1. Actualizar valores NULL en la columna stops si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'buildings' AND column_name = 'stops'
    ) THEN
        UPDATE buildings SET stops = 0 WHERE stops IS NULL;
        RAISE NOTICE 'Actualizados stops NULL a 0';
    END IF;
END $$;

-- 2. Actualizar valores NULL en la columna floorsCount si aún existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'buildings' AND column_name = 'floorsCount'
    ) THEN
        UPDATE buildings SET "floorsCount" = 0 WHERE "floorsCount" IS NULL;
        RAISE NOTICE 'Actualizados floorsCount NULL a 0';
    END IF;
END $$;

-- 3. Verificar el estado final
SELECT
    COUNT(*) as total_buildings,
    COUNT(CASE WHEN stops IS NULL THEN 1 END) as stops_null_count,
    COUNT(CASE WHEN "floorsCount" IS NULL THEN 1 END) as floorscount_null_count
FROM buildings;

RAISE NOTICE 'Base de datos lista para migraciones';
