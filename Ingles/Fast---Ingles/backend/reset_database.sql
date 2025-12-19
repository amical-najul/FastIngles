-- ==============================================================================
-- DATABASE RESET SCRIPT (Fast-Ingles v0.0.10)
-- ⚠️ WARNING: This will DELETE ALL DATA. Run with caution.
-- ==============================================================================

-- 1. DROP EXISTING TABLES (Cascade to remove Foreign Keys)
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS audio_cache CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==============================================================================
-- 2. CREATE TABLES
-- ==============================================================================

-- USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY, -- Using Serial INT for compatibility with Python models
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed password
    role VARCHAR(50) DEFAULT 'user', -- 'user' or 'admin'
    status VARCHAR(50) DEFAULT 'active', -- 'active' or 'inactive'
    photo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LESSONS TABLE
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    day_id INTEGER UNIQUE NOT NULL,
    topic VARCHAR(255) NOT NULL,
    category VARCHAR(50), 
    content JSONB NOT NULL, -- Must contain: word, pronunciation, translation, sentences[], mnemonic
    word_count INTEGER NOT NULL,
    ai_provider VARCHAR(50),
    ai_model VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AUDIO CACHE TABLE (MinIO Metadata)
CREATE TABLE audio_cache (
    id SERIAL PRIMARY KEY,
    text_hash VARCHAR(64) UNIQUE NOT NULL,
    text_content TEXT NOT NULL,
    language VARCHAR(10) NOT NULL, -- 'en-US' or 'es-ES'
    provider VARCHAR(50) NOT NULL,
    minio_key VARCHAR(500) NOT NULL,
    file_size INTEGER,
    duration_seconds FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 0
);

-- PROGRESS TABLE
CREATE TABLE progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_id INTEGER NOT NULL,
    current_index INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0, -- 0 or 1 (Boolean)
    score INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 3. SEED DATA (INITIAL)
-- ==============================================================================

-- ADMIN USER (jock.alcantara@gmail.com / Colombia1@_)
-- Password hash generated with bcrypt
INSERT INTO users (name, email, password, role, status)
VALUES (
    'Admin User', 
    'jock.alcantara@gmail.com', 
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 
    'admin', 
    'active'
);

-- LESSON 1: VERBS LEVEL 1 (Correct Schema)
INSERT INTO lessons (day_id, topic, category, word_count, content, ai_provider, ai_model)
VALUES (
    1, 
    'Nivel 1: El Núcleo', 
    'verbs', 
    50, 
    '[
        {
            "word": "be", 
            "pronunciation": "bi", 
            "translation": "ser/estar", 
            "sentences": ["I want to be happy", "She will be there", "Do not be sad", "It can be true", "You have to be strong"], 
            "mnemonic": "Imagine a BEE (abeja) that wants to BE (ser) human"
        },
        {
            "word": "have", 
            "pronunciation": "hav", 
            "translation": "tener", 
            "sentences": ["I have a car", "Do you have time?", "We have to go", "They have a dog", "I have no idea"], 
            "mnemonic": "I HAVE (tengo) a HAVen (refugio) in my house"
        },
        {
            "word": "do", "pronunciation": "du", "translation": "hacer", "sentences": ["I do my homework", "Do it now", "What do you do?", "I can do it", "Do your best"], "mnemonic": "DU-ermes mientras haces la tarea"
        },
        {
            "word": "say", "pronunciation": "sei", "translation": "decir", "sentences": ["Say something", "Don''t say that", "What did you say?", "I say yes", "Can you say it again?"], "mnemonic": "SEI-s personas dicen lo mismo"
        },
        {
            "word": "go", "pronunciation": "gou", "translation": "ir", "sentences": ["Let''s go", "I go to school", "Where do you go?", "Go away", "I have to go"], "mnemonic": "GOU-l de ir hacia la meta"
        }
    ]'::jsonb,
    'seed',
    'manual'
);
