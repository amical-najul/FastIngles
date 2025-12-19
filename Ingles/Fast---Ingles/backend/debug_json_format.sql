-- CHECK JSON KEYS
-- Run this to confirm what keys exist in your current JSON data
SELECT 
    day_id, 
    jsonb_object_keys(content->0) as keys_in_first_object 
FROM lessons 
WHERE day_id = 1;

-- EXPECTED OUTPUT for valid code:
-- - word
-- - pronunciation
-- - translation
-- - sentences
-- - mnemonic

-- IF YOU SEE 'example' or 'context' instead, the data is INVALID for the current code.
