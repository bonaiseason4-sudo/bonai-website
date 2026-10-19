-- Display name in Arabic, shown instead of the username. Not unique.
-- Nullable so accounts created before this migration keep working until they add a name.
ALTER TABLE users ADD COLUMN name TEXT CHECK (name IS NULL OR length(trim(name)) BETWEEN 1 AND 50);
