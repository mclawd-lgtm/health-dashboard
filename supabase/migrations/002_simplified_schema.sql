-- Mausam Master Dashboard - Simplified Schema
-- ONLY Health Tracking + Settings

-- ============================================
-- HABITS MODULE (Keep this)
-- ============================================

CREATE TABLE IF NOT EXISTS habits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(10) DEFAULT '✓',
    color VARCHAR(7) DEFAULT '#3b82f6',
    order_index INTEGER DEFAULT 0,
    is_two_step BOOLEAN DEFAULT false,
    target_value INTEGER DEFAULT 1,
    unit VARCHAR(50),
    category VARCHAR(50) DEFAULT 'general',
    archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value INTEGER DEFAULT 0,
    note TEXT,
    fasting_hours INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, habit_id, date)
);

-- ============================================
-- SETTINGS MODULE (Keep this)
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ui_prefs JSONB DEFAULT '{}',
    health_prefs JSONB DEFAULT '{}',
    notification_prefs JSONB DEFAULT '{}',
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REMOVED (Not needed in this database):
-- - gold_rates (widget fetches live, no storage)
-- - user_tasks (WATCHTOWER has its own DB)
-- - sync_log (not needed)
-- ============================================

-- Enable RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can CRUD own habits"
    ON habits FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own habit entries"
    ON habit_entries FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own settings"
    ON user_settings FOR ALL
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_entries_user_id ON habit_entries(user_id);
CREATE INDEX idx_habit_entries_date ON habit_entries(user_id, date);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habit_entries_updated_at BEFORE UPDATE ON habit_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default habits (copied to new users)
INSERT INTO habits (id, name, icon, color, order_index, is_two_step, category) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Fasting', '🍽️', '#f59e0b', 0, false, 'health'),
    ('00000000-0000-0000-0000-000000000002', '5 Ltr Water', '💧', '#3b82f6', 1, false, 'health'),
    ('00000000-0000-0000-0000-000000000003', 'No Eat Outside', '🍔', '#ef4444', 2, false, 'health'),
    ('00000000-0000-0000-0000-000000000004', 'Running', '🏃', '#10b981', 3, false, 'fitness'),
    ('00000000-0000-0000-0000-000000000005', 'Exercise', '💪', '#8b5cf6', 4, false, 'fitness'),
    ('00000000-0000-0000-0000-000000000006', 'Protein', '🥩', '#f97316', 5, false, 'nutrition'),
    ('00000000-0000-0000-0000-000000000007', 'Meditation', '🧘', '#ec4899', 6, false, 'wellness'),
    ('00000000-0000-0000-0000-000000000008', 'Vitamins 2 Times', '💊', '#06b6d4', 7, false, 'health'),
    ('00000000-0000-0000-0000-000000000009', 'Reading', '📚', '#6366f1', 8, false, 'learning'),
    ('00000000-0000-0000-0000-000000000010', '2 Brush', '🪥', '#14b8a6', 9, false, 'health'),
    ('00000000-0000-0000-0000-000000000011', 'Travel', '🚗', '#84cc16', 10, false, 'lifestyle'),
    ('00000000-0000-0000-0000-000000000012', 'No Fap', '🚫', '#dc2626', 11, false, 'discipline')
ON CONFLICT DO NOTHING;
