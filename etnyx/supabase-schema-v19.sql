-- Migration v19: Password resets table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS password_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_customer_reset UNIQUE (customer_id)
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
