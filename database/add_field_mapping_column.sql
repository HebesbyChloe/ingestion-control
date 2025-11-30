-- ============================================
-- Add field_mapping column to sys_feeds table
-- ============================================

-- Add field_mapping JSONB column to store field mappings separately from rules
ALTER TABLE sys_feeds 
ADD COLUMN IF NOT EXISTS field_mapping JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN sys_feeds.field_mapping IS 'Field mappings stored as JSONB array. Each mapping contains source field, target field (or "ignore"), module, table, and other metadata.';

