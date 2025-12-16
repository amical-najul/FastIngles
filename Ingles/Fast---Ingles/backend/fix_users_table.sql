-- =====================================================
-- CRITICAL FIX: Add missing PASSWORD column to users table
-- =====================================================

-- Add password column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Make it NOT NULL after adding (allows existing rows to have NULL temporarily)
-- If you have existing users, you'll need to set passwords first
-- ALTER TABLE users ALTER COLUMN password SET NOT NULL;

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
