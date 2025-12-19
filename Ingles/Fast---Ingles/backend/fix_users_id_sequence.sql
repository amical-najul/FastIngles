-- =====================================================
-- FIX: Remove foreign key constraint on users.id
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Find all constraints on users table
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'users';

-- Step 2: Drop the problematic foreign key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Step 3: Verify constraint is removed
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'users';

-- Step 4: Ensure id has default UUID
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 5: Verify column setup
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';
