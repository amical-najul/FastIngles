-- FIX LESSON 1 CONTENT
-- The previous seed had invalid structure (missing pronunciation, sentences list, mnemonic).
-- This fixes it to match strict frontend schema.

UPDATE lessons 
SET content = '[
    {
        "word": "be", 
        "pronunciation": "bi", 
        "translation": "ser/estar", 
        "sentences": [
            "I want to be happy", 
            "She will be there", 
            "Don''t be sad", 
            "It can be true", 
            "You have to be strong"
        ], 
        "mnemonic": "Imagine a BEE (abeja) that wants to BE (ser) human"
    },
    {
        "word": "have", 
        "pronunciation": "hav", 
        "translation": "tener", 
        "sentences": [
            "I have a car", 
            "Do you have time?", 
            "We have to go", 
            "They have a dog", 
            "I have no idea"
        ], 
        "mnemonic": "I HAVE (tengo) a HAVen (refugio) in my house"
    }
]'::jsonb,
word_count = 2
WHERE day_id = 1;

-- Verify
SELECT day_id, jsonb_array_length(content) as count FROM lessons WHERE day_id = 1;
