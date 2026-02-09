# Migration Runner

## Quick Start

### Option 1: Run Migration Script (Limited)
```bash
cd mausam-master-dashboard
node scripts/migrate.js 002_simplified_schema.sql
```

**Note:** This has limited SQL support due to Supabase security.

### Option 2: Supabase CLI (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref ddvrlkauzfpdomlveshy

# Push migrations
supabase db push
```

### Option 3: SQL Editor (Fastest)
1. Go to https://supabase.com/dashboard
2. Select "Master Mausam Dashboard"
3. SQL Editor → New query
4. Copy content from `supabase/migrations/002_simplified_schema.sql`
5. Click Run

## Available Migrations

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Full schema (habits, gold_rates, tasks) |
| `002_simplified_schema.sql` | Health + Settings only (recommended) |

## Current Status

**Connected to:**
- Supabase: https://ddvrlkauzfpdomlveshy.supabase.co
- Database: PostgreSQL 17

**To check current tables:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```
