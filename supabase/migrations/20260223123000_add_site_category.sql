-- Add category column to sites table for industry benchmarking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sites' AND column_name = 'category'
    ) THEN
        ALTER TABLE sites ADD COLUMN category text;
    END IF;
END $$;
