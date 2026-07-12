-- Gmail Integration Migrations

-- 1. Create table for Gmail OAuth Connections
CREATE TABLE IF NOT EXISTS public.gmail_connections (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    credentials JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- 2. Create table for synced Gmail Emails
CREATE TABLE IF NOT EXISTS public.gmail_emails (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    thread_id VARCHAR(255),
    sender VARCHAR(255),
    subject VARCHAR(512),
    snippet TEXT,
    body TEXT,
    date VARCHAR(255),
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, message_id)
);

-- 3. Add user_id to existing tables (nullable initially to prevent breaking existing mock data)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.chat_history ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS user_id UUID;
