-- =====================================================
-- Fast-Ingles Database Schema for Supabase
-- =====================================================

-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================

-- Tabla: lessons
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    day_id INTEGER UNIQUE NOT NULL,
    topic VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    content JSONB NOT NULL,
    word_count INTEGER NOT NULL,
    ai_provider VARCHAR(100),
    ai_model VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_day_id ON lessons(day_id);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(category);

-- =====================================================

-- Tabla: progress
CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_id INTEGER NOT NULL,
    current_index INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, day_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_day_id ON progress(day_id);

-- =====================================================

-- Tabla: audio_cache
CREATE TABLE IF NOT EXISTS audio_cache (
    id SERIAL PRIMARY KEY,
    text_hash VARCHAR(64) UNIQUE NOT NULL,
    text_content TEXT NOT NULL,
    language VARCHAR(10) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    minio_key VARCHAR(500) NOT NULL,
    file_size INTEGER,
    duration_seconds REAL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_accessed TIMESTAMP DEFAULT NOW(),
    access_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_audio_cache_text_hash ON audio_cache(text_hash);
CREATE INDEX IF NOT EXISTS idx_audio_cache_provider ON audio_cache(provider);

-- =====================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audio_cache_last_accessed BEFORE UPDATE ON audio_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
