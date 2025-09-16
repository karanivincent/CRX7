-- Migration: Restructure database for store-first architecture
-- This removes intermediate state fields and adds proper winner tracking

-- Add new fields to draw table
ALTER TABLE draw ADD COLUMN completed_at TIMESTAMP;
ALTER TABLE draw ADD COLUMN round_duration_ms INTEGER;

-- Remove intermediate state fields from draw table
ALTER TABLE draw DROP COLUMN IF EXISTS current_stage;
ALTER TABLE draw DROP COLUMN IF EXISTS current_draw_number;
ALTER TABLE draw DROP COLUMN IF EXISTS total_participants;
ALTER TABLE draw DROP COLUMN IF EXISTS winners_count;

-- Modify total_prize_pool to be nullable (only set on completion)
ALTER TABLE draw ALTER COLUMN total_prize_pool DROP NOT NULL;
ALTER TABLE draw ALTER COLUMN total_prize_pool DROP DEFAULT;

-- Add new fields to winner table for better tracking
ALTER TABLE winner ADD COLUMN draw_sequence INTEGER;
ALTER TABLE winner ADD COLUMN sequence_number INTEGER;
ALTER TABLE winner ADD COLUMN animal_name TEXT;
ALTER TABLE winner ADD COLUMN animal_emoji TEXT;
ALTER TABLE winner ADD COLUMN won_at TIMESTAMP;

-- Make participant_id optional (we may not always have participant records)
ALTER TABLE winner ALTER COLUMN participant_id DROP NOT NULL;

-- Migrate existing data if any exists
-- Update draw_sequence and sequence_number from existing position field
UPDATE winner 
SET 
  draw_sequence = COALESCE(position, 1),
  sequence_number = COALESCE(position, 1),
  won_at = COALESCE(created_at, NOW())
WHERE draw_sequence IS NULL;

-- Try to populate animal data from participant table if available
UPDATE winner 
SET 
  animal_name = p.animal_name,
  animal_emoji = p.animal_emoji
FROM participant p 
WHERE winner.participant_id = p.id 
  AND winner.animal_name IS NULL;

-- Set defaults for any remaining null values
UPDATE winner 
SET 
  animal_name = COALESCE(animal_name, 'Unknown'),
  animal_emoji = COALESCE(animal_emoji, '🎯'),
  won_at = COALESCE(won_at, created_at)
WHERE animal_name IS NULL OR animal_emoji IS NULL OR won_at IS NULL;

-- Make new fields required after migration
ALTER TABLE winner ALTER COLUMN draw_sequence SET NOT NULL;
ALTER TABLE winner ALTER COLUMN sequence_number SET NOT NULL;
ALTER TABLE winner ALTER COLUMN animal_name SET NOT NULL;
ALTER TABLE winner ALTER COLUMN animal_emoji SET NOT NULL;
ALTER TABLE winner ALTER COLUMN won_at SET NOT NULL;

-- Remove the old position field (replaced by draw_sequence and sequence_number)
ALTER TABLE winner DROP COLUMN IF EXISTS position;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_winner_draw_sequence ON winner(draw_id, draw_sequence);
CREATE INDEX IF NOT EXISTS idx_winner_sequence_number ON winner(draw_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_draw_status ON draw(status);
CREATE INDEX IF NOT EXISTS idx_draw_completed_at ON draw(completed_at) WHERE completed_at IS NOT NULL;