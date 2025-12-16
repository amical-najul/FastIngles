-- Fast-Ingles Database Schema (Supabase Optimized)
-- PostgreSQL 16
-- Note: Supabase provides auth schema. We link public.users to auth.users.

-- 1. Levels Table (New) - Difficulty hierarchy
CREATE TABLE IF NOT EXISTS levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'A1', 'A2', 'B1'
    description TEXT,
    difficulty_order INTEGER NOT NULL DEFAULT 0, -- 1, 2, 3...
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Categories Table (New) - Topic grouping
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'Grammar', 'Vocabulary', 'Listening'
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. Users Table (Modified for Supabase Auth)
-- Links to auth.users via UUID
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'user'
    status VARCHAR(50) DEFAULT 'active',
    photo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 4. Lessons Table (Modified)
-- Uses integer IDs for internal references but maps to Categories/Levels
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    day_id INTEGER UNIQUE NOT NULL, -- Keep legacy ID for compatibility if needed
    topic VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL, -- FK
    level_id INTEGER REFERENCES levels(id) ON DELETE SET NULL, -- FK
    content JSONB NOT NULL,
    word_count INTEGER NOT NULL,
    ai_provider VARCHAR(50),
    ai_model VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_lessons_day_id ON lessons(day_id);
CREATE INDEX IF NOT EXISTS idx_lessons_category_id ON lessons(category_id);

-- 5. Progress Table (Modified)
CREATE TABLE IF NOT EXISTS progress (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Changed to UUID
    day_id INTEGER NOT NULL,
    current_index INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(user_id, day_id)
);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);

-- 6. Audio Cache
CREATE TABLE IF NOT EXISTS audio_cache (
    id SERIAL PRIMARY KEY,
    text_hash VARCHAR(64) UNIQUE NOT NULL,
    text_content TEXT NOT NULL,
    language VARCHAR(10) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    minio_key VARCHAR(500) NOT NULL,
    file_size INTEGER,
    duration_seconds FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    access_count INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_audio_cache_text_hash ON audio_cache(text_hash);

-- 7. User AI Config
CREATE TABLE IF NOT EXISTS user_ai_config (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, -- UUID
    provider VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    model VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- UUID
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Utilities: Updated_At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- KEY: Auto-create public user when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users (Safe to fail if no permissions, but expected to work)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Seed Basic Data
INSERT INTO levels (name, difficulty_order, description) VALUES
('A1', 1, 'Beginner'),
('A2', 2, 'Elementary'),
('B1', 3, 'Intermediate'),
('B2', 4, 'Upper Intermediate'),
('C1', 5, 'Advanced')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name, slug, description) VALUES
('Grammar', 'grammar', 'Grammar rules and structures'),
('Vocabulary', 'vocabulary', 'Word lists and usage'),
('Conversation', 'conversation', 'Dialogues and speaking practice'),
('Listening', 'listening', 'Audio comprehension'),
('Reading', 'reading', 'Text comprehension')
ON CONFLICT (name) DO NOTHING;
