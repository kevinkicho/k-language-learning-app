-- Update existing sentences to use correct language code
UPDATE sentences SET language_code = 'es-es' WHERE language_code = 'es';

-- Update the default value for new sentences (this will be applied in the schema)
-- Note: SQLite doesn't support ALTER TABLE to change default values easily
-- The schema change will apply to new records 